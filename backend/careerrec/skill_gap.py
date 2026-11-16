"""Skill-gap analysis grounded in job-posting demand."""

from __future__ import annotations

from dataclasses import dataclass

import pandas as pd

from .data import Career


@dataclass
class SkillGap:
    skill: str
    demand: float  # share of postings for this career that ask for the skill
    priority: str  # Critical / Important / Nice to have


def _priority(demand: float) -> str:
    if demand >= 0.6:
        return "Critical"
    if demand >= 0.35:
        return "Important"
    return "Nice to have"


def analyze_skill_gap(
    career: Career, demand: pd.DataFrame, user_skills: list[str], top_n: int = 12, min_demand: float = 0.15
) -> dict:
    """Compare the user's skills with the most in-demand skills for ``career``.

    Returns matched skills, prioritised missing skills and a demand-weighted
    coverage score (what share of the market's skill "mass" the user already has).
    """
    row = demand.loc[career.id].sort_values(ascending=False)
    required = row[row >= min_demand].head(top_n)
    for skill in career.core_skills:  # always consider taxonomy core skills
        if skill not in required.index and skill in row.index:
            required.loc[skill] = row[skill]
    required = required.sort_values(ascending=False)

    have = set(user_skills)
    matched = [s for s in required.index if s in have]
    missing = [
        SkillGap(s, round(float(required[s]), 3), _priority(float(required[s])))
        for s in required.index
        if s not in have
    ]
    total = float(required.sum()) or 1.0
    coverage = float(required[matched].sum()) / total if matched else 0.0
    return {"matched": matched, "missing": missing, "coverage": round(coverage, 3)}
