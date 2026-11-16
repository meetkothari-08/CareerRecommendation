"""Loaders for the career knowledge base, job postings and evaluation profiles."""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path

import pandas as pd

from . import paths


@dataclass(frozen=True)
class Career:
    id: str
    title: str
    family: str
    description: str
    core_skills: list[str]
    secondary_skills: list[str]
    interests: list[str]
    education: str
    salary_usd: tuple[int, int]
    growth: str
    next_roles: list[str] = field(default_factory=list)

    @property
    def all_skills(self) -> list[str]:
        return self.core_skills + self.secondary_skills


def load_careers(path: Path = paths.CAREERS_PATH) -> list[Career]:
    raw = json.loads(Path(path).read_text(encoding="utf-8"))
    return [Career(**{**c, "salary_usd": tuple(c["salary_usd"])}) for c in raw]


def load_skill_aliases(path: Path = paths.SKILL_ALIASES_PATH) -> dict[str, list[str]]:
    return json.loads(Path(path).read_text(encoding="utf-8"))


def load_postings(path: Path = paths.POSTINGS_PATH) -> pd.DataFrame:
    df = pd.read_csv(path, parse_dates=["posted_date"])
    df["skills"] = df["skills"].fillna("").map(lambda s: [x for x in s.split(";") if x])
    return df


def load_profiles(path: Path) -> list[dict]:
    return json.loads(Path(path).read_text(encoding="utf-8"))
