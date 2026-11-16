"""Two-tower neural recommender.

A *user tower* encodes a profile (TF-IDF skill vector + TF-IDF interest/goal
text vector) and a *career tower* encodes each career (its market skill-demand
profile + description text + a learned ID embedding). Both towers output
L2-normalised 64-d embeddings; relevance is their cosine similarity divided by a
temperature.

Training uses a listwise softmax loss over all 56 careers with *soft* targets
(the profile's primary career weighted 2, acceptable alternatives weighted 1),
on labelled profiles plus job postings used as skill-only pseudo-profiles with
skill dropout augmentation.

The model is trained with PyTorch, then exported to NumPy arrays: serving needs
only a matrix multiply, so the API does not depend on PyTorch.
"""

from __future__ import annotations

from dataclasses import dataclass, field

import numpy as np
import scipy.sparse as sp


@dataclass
class TwoTowerConfig:
    embedding_dim: int = 64
    hidden_dim: int = 256
    dropout: float = 0.2
    temperature: float = 0.1
    lr: float = 2e-3
    weight_decay: float = 1e-4
    epochs: int = 40
    batch_size: int = 128
    skill_dropout: float = 0.2
    posting_weight: float = 0.5  # loss weight of posting pseudo-profiles vs. labelled profiles
    patience: int = 6
    seed: int = 42

    def to_dict(self) -> dict:
        return dict(self.__dict__)


@dataclass
class NumpyTwoTower:
    """Framework-free inference: user-tower MLP + precomputed career embeddings."""

    w1: np.ndarray
    b1: np.ndarray
    w2: np.ndarray
    b2: np.ndarray
    career_embeddings: np.ndarray  # (n_careers, d), L2-normalised
    temperature: float
    config: dict = field(default_factory=dict)

    def user_embeddings(self, X) -> np.ndarray:
        h = np.maximum(X @ self.w1 + self.b1, 0.0)
        z = np.asarray(h @ self.w2 + self.b2)
        return z / np.maximum(np.linalg.norm(z, axis=1, keepdims=True), 1e-8)

    def scores(self, X) -> np.ndarray:
        """Cosine similarity in [-1, 1] between each profile row and every career."""
        return self.user_embeddings(X) @ self.career_embeddings.T

    def probabilities(self, X) -> np.ndarray:
        logits = self.scores(X) / self.temperature
        logits -= logits.max(axis=1, keepdims=True)
        e = np.exp(logits)
        return e / e.sum(axis=1, keepdims=True)


def soft_targets(profiles: list[dict], ids: list[str]) -> np.ndarray:
    index = {cid: i for i, cid in enumerate(ids)}
    y = np.zeros((len(profiles), len(ids)), dtype=np.float32)
    for r, p in enumerate(profiles):
        for cid in p["relevant"]:
            y[r, index[cid]] = 1.0
        y[r, index[p["target"]]] = 2.0
    return y / y.sum(axis=1, keepdims=True)


def train_two_tower(
    X_profiles: sp.csr_matrix,
    Y_profiles: np.ndarray,
    X_postings: sp.csr_matrix,
    y_postings: np.ndarray,
    career_features: np.ndarray,
    n_skill_features: int,
    config: TwoTowerConfig,
    X_val: sp.csr_matrix | None = None,
    val_eval=None,
) -> tuple[NumpyTwoTower, list[dict]]:
    """Train with PyTorch and return the exported NumPy model plus a training history.

    ``val_eval`` is an optional callback ``scores -> float`` (higher is better) used
    for early stopping on the validation profiles.
    """
    import torch
    from torch import nn

    torch.manual_seed(config.seed)
    rng = np.random.default_rng(config.seed)
    n_careers, n_in = career_features.shape[0], X_profiles.shape[1]

    class Tower(nn.Module):
        def __init__(self, n_inputs: int):
            super().__init__()
            self.net = nn.Sequential(
                nn.Linear(n_inputs, config.hidden_dim),
                nn.ReLU(),
                nn.Dropout(config.dropout),
                nn.Linear(config.hidden_dim, config.embedding_dim),
            )

        def forward(self, x):
            return self.net(x)

    class TwoTower(nn.Module):
        def __init__(self):
            super().__init__()
            self.user = Tower(n_in)
            self.career = Tower(career_features.shape[1])
            self.career_id = nn.Embedding(n_careers, config.embedding_dim)
            nn.init.normal_(self.career_id.weight, std=0.01)

        def career_embeddings(self, cf):
            z = self.career(cf) + self.career_id.weight
            return nn.functional.normalize(z, dim=1)

        def forward(self, x, cf):
            u = nn.functional.normalize(self.user(x), dim=1)
            return u @ self.career_embeddings(cf).T / config.temperature

    model = TwoTower()
    opt = torch.optim.AdamW(model.parameters(), lr=config.lr, weight_decay=config.weight_decay)
    cf = torch.tensor(career_features, dtype=torch.float32)

    # Training pool: labelled profiles (soft targets) + postings (one-hot targets, skills only).
    Y_post = np.zeros((X_postings.shape[0], n_careers), dtype=np.float32)
    Y_post[np.arange(len(y_postings)), y_postings] = 1.0
    X_all = sp.vstack([X_profiles, X_postings]).tocsr().astype(np.float32)
    Y_all = np.vstack([Y_profiles, Y_post]).astype(np.float32)
    w_all = np.concatenate([np.ones(X_profiles.shape[0]), np.full(X_postings.shape[0], config.posting_weight)])
    is_posting = np.concatenate([np.zeros(X_profiles.shape[0], bool), np.ones(X_postings.shape[0], bool)])

    def export() -> NumpyTwoTower:
        model.eval()
        with torch.no_grad():
            emb = model.career_embeddings(cf).numpy()
        sd = {k: v.detach().numpy().copy() for k, v in model.user.state_dict().items()}
        return NumpyTwoTower(
            w1=sd["net.0.weight"].T,
            b1=sd["net.0.bias"],
            w2=sd["net.3.weight"].T,
            b2=sd["net.3.bias"],
            career_embeddings=emb,
            temperature=config.temperature,
            config=config.to_dict(),
        )

    best, best_score, stale, history = None, -np.inf, 0, []
    for epoch in range(config.epochs):
        model.train()
        order = rng.permutation(X_all.shape[0])
        total = 0.0
        for start in range(0, len(order), config.batch_size):
            idx = order[start : start + config.batch_size]
            xb = X_all[idx].toarray()
            # Skill dropout on postings simulates users who list only part of their skills.
            drop = (rng.random((len(idx), n_skill_features)) < config.skill_dropout) & is_posting[idx, None]
            xb[:, :n_skill_features][drop] = 0.0
            xb = torch.tensor(xb)
            logits = model(xb, cf)
            loss_per = -(torch.tensor(Y_all[idx]) * torch.log_softmax(logits, dim=1)).sum(dim=1)
            wb = torch.tensor(w_all[idx], dtype=torch.float32)
            loss = (loss_per * wb).sum() / wb.sum()
            opt.zero_grad()
            loss.backward()
            opt.step()
            total += float(loss) * len(idx)

        record = {"epoch": epoch + 1, "train_loss": total / len(order)}
        if X_val is not None and val_eval is not None:
            exported = export()
            record["val_score"] = val_eval(exported.scores(X_val))
            if record["val_score"] > best_score + 1e-4:
                best, best_score, stale = exported, record["val_score"], 0
            else:
                stale += 1
        history.append(record)
        if X_val is not None and stale >= config.patience:
            break
    return (best if best is not None else export()), history
