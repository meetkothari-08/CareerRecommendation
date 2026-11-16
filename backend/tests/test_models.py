import importlib.util

import numpy as np
import pytest
import scipy.sparse as sp

from careerrec.neural import NumpyTwoTower, TwoTowerConfig, soft_targets
from careerrec.rankers import LambdaMARTRanker, LogisticRanker


def _toy_ranking_data(n_queries=60, n_items=8, seed=0):
    rng = np.random.default_rng(seed)
    X = rng.normal(size=(n_queries * n_items, 4))
    # Feature 0 drives relevance; the rest is noise.
    y = np.digitize(X[:, 0] + 0.3 * rng.normal(size=len(X)), [0.5, 1.5])
    return X, y, [n_items] * n_queries


@pytest.mark.parametrize("ranker", [LogisticRanker(), LambdaMARTRanker(num_boost_round=50, min_data_in_leaf=5)])
def test_rankers_learn_signal_and_explain(ranker):
    X, y, groups = _toy_ranking_data()
    ranker.fit(X, y, groups)
    scores = ranker.predict(X)
    assert scores.min() >= 0 and scores.max() <= 1
    assert np.corrcoef(scores, X[:, 0])[0, 1] > 0.7
    contrib = ranker.contributions(X)
    assert contrib.shape == X.shape
    assert np.abs(contrib[:, 0]).mean() > np.abs(contrib[:, 1:]).mean()


def test_soft_targets_weight_primary_career_double():
    y = soft_targets([{"target": "b", "relevant": ["a", "b"]}], ["a", "b", "c"])
    assert np.allclose(y, [[1 / 3, 2 / 3, 0]])


def test_numpy_two_tower_scores_are_cosine():
    rng = np.random.default_rng(0)
    emb = rng.normal(size=(5, 4))
    emb /= np.linalg.norm(emb, axis=1, keepdims=True)
    nn = NumpyTwoTower(rng.normal(size=(6, 8)), np.zeros(8), rng.normal(size=(8, 4)), np.zeros(4), emb, 0.1)
    s = nn.scores(sp.csr_matrix(rng.random((3, 6))))
    assert s.shape == (3, 5) and np.all(np.abs(s) <= 1 + 1e-6)
    assert np.allclose(nn.probabilities(sp.csr_matrix(rng.random((2, 6)))).sum(axis=1), 1)


@pytest.mark.skipif(importlib.util.find_spec("torch") is None, reason="PyTorch not installed")
def test_two_tower_training_and_numpy_export_learn_toy_task():
    from careerrec.neural import train_two_tower

    rng = np.random.default_rng(0)
    n_careers, n_feat = 4, 12
    career_features = np.eye(n_careers, n_feat, dtype=np.float32)
    y = rng.integers(0, n_careers, 400)
    X = np.zeros((400, n_feat), dtype=np.float32)
    X[np.arange(400), y] = 1.0  # feature i indicates career i
    X += 0.1 * rng.random(X.shape).astype(np.float32)
    Y = np.eye(n_careers, dtype=np.float32)[y]
    cfg = TwoTowerConfig(epochs=15, hidden_dim=32, embedding_dim=8, skill_dropout=0.0)
    model, history = train_two_tower(sp.csr_matrix(X), Y, sp.csr_matrix(X[:0]), y[:0], career_features, n_feat, cfg)
    assert history[-1]["train_loss"] < history[0]["train_loss"]
    accuracy = (model.scores(sp.csr_matrix(X)).argmax(axis=1) == y).mean()
    assert accuracy > 0.95
