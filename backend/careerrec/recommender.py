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

Stage 2 - learned ranker: a logistic-regression model trained on labelled
profiles combines the stage-1 signals into a relevance probability. Its
expected graded relevance is the final ranking score (0-1).
"""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfTransformer, TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.pipeline import Pipeline, make_pipeline
from sklearn.preprocessing import MultiLabelBinarizer, StandardScaler, normalize

from .data import Career
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


class CareerRecommender:
    def __init__(self, careers: list[Career], extractor: SkillExtractor):
        self.careers = careers
        self.ids = [c.id for c in careers]
        self.career_index = {cid: i for i, cid in enumerate(self.ids)}
        self.extractor = extractor
        self.weights = dict(DEFAULT_WEIGHTS)  # linear blend used until a ranker is trained
        self.ranker: Pipeline | None = None

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

    # ------------------------------------------------------------ stage 1 inference
    def skill_vector(self, skills: list[str]):
        return self.tfidf.transform(self.mlb.transform([[s for s in skills if s in self.mlb.classes_]]))

    def signals(self, profile: UserProfile) -> dict:
        """Per-career stage-1 signals for one profile."""
        n = len(self.careers)
        skills = self.extractor.extract(profile.skills)
        x = self.skill_vector(skills)

        proba = np.zeros(n)
        proba[self.classifier.classes_] = self.classifier.predict_proba(x)[0]
        skill_sim = cosine_similarity(x, self.career_skill_vectors)[0] if x.nnz else np.zeros(n)

        text = f"{profile.interests} {profile.goals}".strip()
        text_sim = (
            cosine_similarity(self.text_vectorizer.transform([text]), self.career_text_vectors)[0]
            if text
            else np.zeros(n)
        )

        level = education_level(profile.education)
        edu_fit = (
            np.full(n, 0.5)
            if level is None
            else np.clip(1.0 - 0.5 * np.maximum(self.career_education - level, 0), 0.0, 1.0)
        )

        user = set(skills)
        jaccard = np.array([len(user & a) / len(user | a) if user else 0.0 for a in self._all])
        coverage = np.array([len(user & c) / len(c) for c in self._core])
        return {
            "skills": skills,
            "classifier": proba,
            "skill_similarity": skill_sim,
            "interest_similarity": text_sim,
            "education_fit": edu_fit,
            "taxonomy_jaccard": jaccard,
            "core_skill_coverage": coverage,
        }

    @staticmethod
    def _scaled(v: np.ndarray) -> np.ndarray:
        return v / v.max() if v.max() > 0 else v

    def features(self, sig: dict) -> np.ndarray:
        proba = sig["classifier"]
        rank = np.argsort(np.argsort(-proba))
        return np.column_stack(
            [
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
        )

    # ------------------------------------------------------------ stage 2
    def fit_ranker(self, profiles: list[dict], C: float = 1.0) -> CareerRecommender:
        """Train the learned ranker on profiles labelled with ``target`` and ``relevant`` careers."""
        X, y = [], []
        for p in profiles:
            X.append(
                self.features(
                    self.signals(
                        UserProfile(p["skills"], p["interests"], p["education"], p["experience_years"], p["goals"])
                    )
                )
            )
            relevant = set(p["relevant"])
            y.append([2 if cid == p["target"] else int(cid in relevant) for cid in self.ids])
        self.ranker = make_pipeline(StandardScaler(), LogisticRegression(C=C, max_iter=3000))
        self.ranker.fit(np.vstack(X), np.concatenate(y))
        return self

    def linear_score(self, sig: dict, weights: dict[str, float] | None = None) -> np.ndarray:
        w = weights or self.weights
        return (
            w["classifier"] * self._scaled(sig["classifier"])
            + w["skill_similarity"] * sig["skill_similarity"]
            + w["interest_similarity"] * self._scaled(sig["interest_similarity"])
            + w["education_fit"] * sig["education_fit"]
        )

    def score(self, sig: dict) -> np.ndarray:
        """Final 0-1 score: expected graded relevance from the ranker (or the linear blend)."""
        if self.ranker is None:
            return self.linear_score(sig)
        proba = self.ranker.predict_proba(self.features(sig))
        gains = dict(zip(self.ranker.classes_, proba.T))
        return 0.5 * gains.get(1, 0) + 1.0 * gains.get(2, 0)

    def rank(self, profile: UserProfile) -> list[str]:
        return [self.ids[i] for i in np.argsort(-self.score(self.signals(profile)))]

    def recommend(self, profile: UserProfile, top_k: int = 5) -> tuple[list[str], list[Recommendation]]:
        sig = self.signals(profile)
        scores = self.score(sig)
        user_skills = set(sig["skills"])
        recs = []
        for i in np.argsort(-scores)[:top_k]:
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
