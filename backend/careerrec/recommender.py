"""Two-stage hybrid career recommender.

Stage 1 - candidate signals (all computed for every career):

* **Skill classifier** - multinomial logistic regression trained on the TF-IDF
  weighted skill bags of job postings (skills -> career). It learns which skill
  *combinations* discriminate between careers.
* **Market skill similarity** - cosine similarity between the user's skill
  vector and each career's demand profile (share of postings that request each
  skill, IDF weighted). Content-based and grounded in live market data.
* **Interest / goal similarity** - TF-IDF cosine similarity between free-text
  interests + goals and each career's description.
* **Taxonomy overlap and education fit** - knowledge-base priors.

* **Two-tower neural model** (optional, ``careerrec/neural.py``) - learned
  user/career embeddings; its score is fed to the ranker as an extra feature.

Stage 2 - learned ranker (``careerrec/rankers.py``): LightGBM LambdaMART (or a
logistic-regression baseline) trained on labelled profiles combines the stage-1
signals into a calibrated relevance score (0-1) with per-feature explanations.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import scipy.sparse as sp
from sklearn.feature_extraction.text import TfidfTransformer, TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import MultiLabelBinarizer, normalize

from .data import Career
from .neural import NumpyTwoTower
from .rankers import LogisticRanker
from .skills import SkillExtractor

EDUCATION_LEVELS = {
    "high school": 0,
    "associate": 1,
    "diploma": 1,
    "bachelor": 2,
    "b.tech": 2,
    "b.e": 2,
    "bsc": 2,
    "master": 3,
    "m.tech": 3,
    "msc": 3,
    "mba": 3,
    "phd": 4,
    "doctor": 4,
}

SIGNALS = ["classifier", "skill_similarity", "interest_similarity", "education_fit"]
DEFAULT_WEIGHTS = {"classifier": 0.35, "skill_similarity": 0.35, "interest_similarity": 0.2, "education_fit": 0.1}
FEATURES = [
    "clf_proba",
    "clf_log_proba",
    "clf_reciprocal_rank",
    "skill_similarity",
    "interest_similarity",
    "interest_similarity_scaled",
    "education_fit",
    "taxonomy_jaccard",
    "core_skill_coverage",
]
NEURAL_FEATURES = ["two_tower_score", "two_tower_reciprocal_rank"]

# Human-readable reasons used to explain a recommendation from feature contributions.
FEATURE_REASONS = {
    "clf_proba": "Your skill set resembles real job postings for this role",
    "clf_log_proba": "Your skill set resembles real job postings for this role",
    "clf_reciprocal_rank": "Your skill set resembles real job postings for this role",
    "skill_similarity": "Strong overlap with the skills employers request",
    "interest_similarity": "Matches your interests and goals",
    "interest_similarity_scaled": "Matches your interests and goals",
    "education_fit": "Fits your education level",
    "taxonomy_jaccard": "You already have core skills for this role",
    "core_skill_coverage": "You already have core skills for this role",
    "two_tower_score": "Neural model: similar profiles fit this career",
    "two_tower_reciprocal_rank": "Neural model: similar profiles fit this career",
}


def education_level(text: str) -> int | None:
    text = (text or "").lower()
    levels = [level for key, level in EDUCATION_LEVELS.items() if key in text]
    return max(levels) if levels else None


@dataclass
class UserProfile:
    skills: str | list[str]
    interests: str = ""
    education: str = ""
    experience_years: float = 0.0
    goals: str = ""


@dataclass
class Recommendation:
    career: Career
    score: float
    classifier_probability: float
    skill_similarity: float
    interest_similarity: float
    matched_skills: list[str] = field(default_factory=list)
    two_tower_score: float | None = None
    explanation: list[dict] = field(default_factory=list)


def profile_from_dict(p: dict) -> UserProfile:
    return UserProfile(p["skills"], p["interests"], p["education"], p["experience_years"], p["goals"])


def graded_labels(p: dict, ids: list[str]) -> list[int]:
    relevant = set(p["relevant"])
    return [2 if cid == p["target"] else int(cid in relevant) for cid in ids]


class CareerRecommender:
    def __init__(self, careers: list[Career], extractor: SkillExtractor):
        self.careers = careers
        self.ids = [c.id for c in careers]
        self.career_index = {cid: i for i, cid in enumerate(self.ids)}
        self.extractor = extractor
        self.weights = dict(DEFAULT_WEIGHTS)  # linear blend used until a ranker is trained
        self.ranker = None
        self.ranker_uses_two_tower = False
        self.two_tower: NumpyTwoTower | None = None
        self.model_name = "linear_blend"

    # ------------------------------------------------------------ stage 1 fit
    def fit(self, postings: pd.DataFrame, C: float = 1.0) -> CareerRecommender:
        vocab = sorted({s for c in self.careers for s in c.all_skills} | {s for row in postings["skills"] for s in row})
        self.mlb = MultiLabelBinarizer(classes=vocab)
        X_bin = self.mlb.fit_transform(postings["skills"])
        self.tfidf = TfidfTransformer(sublinear_tf=True)
        X = self.tfidf.fit_transform(X_bin)

        y = postings["career_id"].map(self.career_index).to_numpy()
        self.classifier = LogisticRegression(C=C, max_iter=3000)
        self.classifier.fit(X, y)

        # Market demand: share of each career's postings that mention a skill.
        demand = np.zeros((len(self.careers), len(vocab)))
        for idx in range(len(self.careers)):
            rows = X_bin[y == idx]
            if len(rows):
                demand[idx] = rows.mean(axis=0)
        self.demand = pd.DataFrame(demand, index=self.ids, columns=vocab)
        # Weight demand shares by IDF (no sublinear tf: shares are < 1 and log would turn them negative).
        self.career_skill_vectors = normalize(demand * self.tfidf.idf_)

        self.text_vectorizer = TfidfVectorizer(ngram_range=(1, 2), stop_words="english", sublinear_tf=True)
        self.career_text_vectors = self.text_vectorizer.fit_transform([self._career_text(c) for c in self.careers])

        self.career_education = np.array([education_level(c.education) or 2 for c in self.careers])
        self._core = [set(c.core_skills) for c in self.careers]
        self._all = [set(c.all_skills) for c in self.careers]
        return self

    @staticmethod
    def _career_text(c: Career) -> str:
        return " ".join([c.title, c.title, c.family, c.description, " ".join(c.interests * 2)])

    # ------------------------------------------------------------ neural inputs
    @property
    def n_skill_features(self) -> int:
        return len(self.mlb.classes_)

    def skill_matrix(self, skill_lists: list[list[str]]):
        known = set(self.mlb.classes_)
        return self.tfidf.transform(self.mlb.transform([[s for s in sk if s in known] for sk in skill_lists]))

    def career_features(self) -> np.ndarray:
        """Career-tower input: IDF-weighted demand profile + description TF-IDF."""
        return np.hstack([self.career_skill_vectors, self.career_text_vectors.toarray()]).astype(np.float32)

    def posting_inputs(self, postings: pd.DataFrame) -> tuple[sp.csr_matrix, np.ndarray]:
        """Postings as skill-only pseudo-profiles for neural training."""
        X_skill = self.skill_matrix(list(postings["skills"]))
        X_text = sp.csr_matrix((X_skill.shape[0], len(self.text_vectorizer.vocabulary_)))
        y = postings["career_id"].map(self.career_index).to_numpy()
        return sp.hstack([X_skill, X_text]).tocsr(), y

    # ------------------------------------------------------------ stage 1 inference
    def skill_vector(self, skills: list[str]):
        return self.skill_matrix([skills])

    def signals(self, profile: UserProfile) -> dict:
        """Per-career stage-1 signals for one profile."""
        n = len(self.careers)
        skills = self.extractor.extract(profile.skills)
        x = self.skill_vector(skills)

        proba = np.zeros(n)
        proba[self.classifier.classes_] = self.classifier.predict_proba(x)[0]
        skill_sim = cosine_similarity(x, self.career_skill_vectors)[0] if x.nnz else np.zeros(n)

        text = f"{profile.interests} {profile.goals}".strip()
        t = self.text_vectorizer.transform([text])
        text_sim = cosine_similarity(t, self.career_text_vectors)[0] if text else np.zeros(n)

        level = education_level(profile.education)
        edu_fit = (
            np.full(n, 0.5)
            if level is None
            else np.clip(1.0 - 0.5 * np.maximum(self.career_education - level, 0), 0.0, 1.0)
        )

        user = set(skills)
        jaccard = np.array([len(user & a) / len(user | a) if user else 0.0 for a in self._all])
        coverage = np.array([len(user & c) / len(c) for c in self._core])
        nn_input = sp.hstack([x, t]).tocsr()
        sig = {
            "skills": skills,
            "nn_input": nn_input,
            "classifier": proba,
            "skill_similarity": skill_sim,
            "interest_similarity": text_sim,
            "education_fit": edu_fit,
            "taxonomy_jaccard": jaccard,
            "core_skill_coverage": coverage,
        }
        if self.two_tower is not None:
            sig["two_tower"] = self.two_tower.scores(nn_input)[0]
        return sig

    @staticmethod
    def _scaled(v: np.ndarray) -> np.ndarray:
        return v / v.max() if v.max() > 0 else v

    def features(self, sig: dict, two_tower_scores: np.ndarray | None = None) -> np.ndarray:
        """Per-career feature matrix for the stage-2 ranker (optionally with neural features)."""
        proba = sig["classifier"]
        rank = np.argsort(np.argsort(-proba))
        cols = [
            proba,
            np.log(proba + 1e-6),
            1.0 / (rank + 1),
            sig["skill_similarity"],
            sig["interest_similarity"],
            self._scaled(sig["interest_similarity"]),
            sig["education_fit"],
            sig["taxonomy_jaccard"],
            sig["core_skill_coverage"],
        ]
        if two_tower_scores is not None:
            nn_rank = np.argsort(np.argsort(-two_tower_scores))
            cols += [two_tower_scores, 1.0 / (nn_rank + 1)]
        return np.column_stack(cols)

    def feature_names(self) -> list[str]:
        return FEATURES + (NEURAL_FEATURES if self.ranker_uses_two_tower else [])

    def _features_for(self, sig: dict) -> np.ndarray:
        return self.features(sig, sig.get("two_tower") if self.ranker_uses_two_tower else None)

    # ------------------------------------------------------------ stage 2
    def fit_ranker(self, profiles: list[dict], C: float = 1.0) -> CareerRecommender:
        """Train the logistic baseline ranker (used for quick cold starts without the full pipeline)."""
        X = np.vstack([self.features(self.signals(profile_from_dict(p))) for p in profiles])
        y = np.concatenate([graded_labels(p, self.ids) for p in profiles])
        self.set_ranker(LogisticRanker(C=C).fit(X, y), uses_two_tower=False, name="logistic_ranker")
        return self

    def set_ranker(self, ranker, uses_two_tower: bool, name: str) -> None:
        self.ranker, self.ranker_uses_two_tower, self.model_name = ranker, uses_two_tower, name

    def linear_score(self, sig: dict, weights: dict[str, float] | None = None) -> np.ndarray:
        w = weights or self.weights
        return (
            w["classifier"] * self._scaled(sig["classifier"])
            + w["skill_similarity"] * sig["skill_similarity"]
            + w["interest_similarity"] * self._scaled(sig["interest_similarity"])
            + w["education_fit"] * sig["education_fit"]
        )

    def score(self, sig: dict) -> np.ndarray:
        """Final 0-1 score from the ranker (or the linear blend before a ranker is trained)."""
        if self.ranker is None:
            return self.linear_score(sig)
        return self.ranker.predict(self._features_for(sig))

    def explain(self, sig: dict, indices) -> list[list[dict]]:
        """Top positive reasons per career, aggregated from per-feature contributions."""
        if self.ranker is None:
            return [[] for _ in indices]
        contrib = self.ranker.contributions(self._features_for(sig))
        names = self.feature_names()
        out = []
        for i in indices:
            grouped: dict[str, float] = {}
            for name, value in zip(names, contrib[i]):
                grouped[FEATURE_REASONS[name]] = grouped.get(FEATURE_REASONS[name], 0.0) + float(value)
            top = sorted(((r, v) for r, v in grouped.items() if v > 0), key=lambda t: -t[1])[:3]
            out.append([{"reason": r, "contribution": round(v, 3)} for r, v in top])
        return out

    def rank(self, profile: UserProfile) -> list[str]:
        return [self.ids[i] for i in np.argsort(-self.score(self.signals(profile)))]

    def recommend(self, profile: UserProfile, top_k: int = 5) -> tuple[list[str], list[Recommendation]]:
        sig = self.signals(profile)
        scores = self.score(sig)
        order = np.argsort(-scores)[:top_k]
        explanations = self.explain(sig, order)
        user_skills = set(sig["skills"])
        recs = []
        for i, why in zip(order, explanations):
            career = self.careers[i]
            ordered = self.demand.loc[career.id].sort_values(ascending=False).index
            recs.append(
                Recommendation(
                    career=career,
                    score=float(scores[i]),
                    classifier_probability=float(sig["classifier"][i]),
                    skill_similarity=float(sig["skill_similarity"][i]),
                    interest_similarity=float(sig["interest_similarity"][i]),
                    matched_skills=[s for s in ordered if s in user_skills],
                    two_tower_score=float(sig["two_tower"][i]) if "two_tower" in sig else None,
                    explanation=why,
                )
            )
        return sig["skills"], recs

    # ------------------------------------------------------------ persistence
    def save(self, path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(self, path)

    @staticmethod
    def load(path: Path) -> CareerRecommender:
        return joblib.load(path)
