"""Builds (or loads) every component needed to serve recommendations."""

from __future__ import annotations

import logging
from dataclasses import dataclass

from . import paths
from .courses import CourseRecommender
from .data import Career, load_careers, load_postings, load_profiles
from .market import MarketAnalyzer
from .recommender import CareerRecommender, UserProfile
from .skill_gap import analyze_skill_gap
from .training import train_recommender

log = logging.getLogger(__name__)


def load_or_train_recommender(careers: list[Career], postings) -> CareerRecommender:
    """Load the persisted model, or train one on the fly (takes a few seconds)."""
    if paths.MODEL_PATH.exists():
        try:
            model = CareerRecommender.load(paths.MODEL_PATH)
            if model.ids == [c.id for c in careers]:
                return model
            log.info("Saved model is out of date with careers.json; retraining")
        except Exception as exc:  # e.g. scikit-learn version mismatch
            log.warning("Could not load %s (%s); retraining", paths.MODEL_PATH, exc)
    # Cold start: fit the fast logistic pipeline. `python -m scripts.train` builds the full
    # neural + LambdaMART model and saves it to models/.
    log.warning(
        "No trained model found at %s; fitting a quick baseline (run `python -m scripts.train`)", paths.MODEL_PATH
    )
    profiles = load_profiles(paths.TRAIN_PROFILES_PATH) if paths.TRAIN_PROFILES_PATH.exists() else None
    return train_recommender(careers, postings, profiles)


@dataclass
class CareerEngine:
    careers: list[Career]
    recommender: CareerRecommender
    market: MarketAnalyzer
    courses: CourseRecommender

    @classmethod
    def load(cls) -> CareerEngine:
        careers = load_careers()
        postings = load_postings()
        return cls(
            careers=careers,
            recommender=load_or_train_recommender(careers, postings),
            market=MarketAnalyzer(postings, careers),
            courses=CourseRecommender(paths.COURSES_PATH),
        )

    @property
    def _titles(self) -> dict[str, str]:
        return {c.id: c.title for c in self.careers}

    def recommend(self, profile: UserProfile, top_k: int = 5, with_courses: bool = True) -> dict:
        skills, recs = self.recommender.recommend(profile, top_k=top_k)
        results = []
        for rec in recs:
            c = rec.career
            gap = analyze_skill_gap(c, self.recommender.demand, skills)
            missing = [g.__dict__ for g in gap["missing"]]
            results.append(
                {
                    "career_id": c.id,
                    "title": c.title,
                    "family": c.family,
                    "description": c.description,
                    "match_score": round(rec.score * 100, 1),
                    "confidence": round(rec.classifier_probability, 3),
                    "signals": {
                        "classifier": round(rec.classifier_probability, 3),
                        "skill_similarity": round(rec.skill_similarity, 3),
                        "interest_similarity": round(rec.interest_similarity, 3),
                        **({"two_tower": round(rec.two_tower_score, 3)} if rec.two_tower_score is not None else {}),
                    },
                    "explanation": rec.explanation,
                    "skill_coverage": gap["coverage"],
                    "matched_skills": gap["matched"],
                    "missing_skills": missing,
                    "salary_range_usd": list(c.salary_usd),
                    "growth": c.growth,
                    "education": c.education,
                    "next_roles": [self._titles[r] for r in c.next_roles],
                    "market": self.market.summary(c.id),
                    "courses": (
                        self.courses.for_skill_gaps([g["skill"] for g in missing], c.title) if with_courses else []
                    ),
                }
            )
        return {"extracted_skills": skills, "recommendations": results}
