"""Model training entry point shared by the CLI script and the API cold start."""

from __future__ import annotations

import pandas as pd

from .data import Career, load_skill_aliases
from .recommender import CareerRecommender
from .skills import SkillExtractor


def build_extractor(careers: list[Career]) -> SkillExtractor:
    return SkillExtractor({s for c in careers for s in c.all_skills}, load_skill_aliases())


def train_recommender(
    careers: list[Career], postings: pd.DataFrame, ranker_profiles: list[dict] | None, classifier_C: float = 1.0
) -> CareerRecommender:
    model = CareerRecommender(careers, build_extractor(careers)).fit(postings, C=classifier_C)
    if ranker_profiles:
        model.fit_ranker(ranker_profiles)
    return model
