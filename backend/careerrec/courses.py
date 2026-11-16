"""Course recommender over a Coursera course catalogue (``data/courses.csv``).

Matching is intentionally precise: a course qualifies only if every term of the
missing skill appears in its title (the catalogue's skill tags are too noisy to
use). Shorter, more specific titles rank first, weighted by learner rating.
"""

from __future__ import annotations

import re
from pathlib import Path

import pandas as pd

_STOP = {"and", "of", "the", "for", "to", "in", "a", "with"}
_ROLE_WORDS = {
    "engineer",
    "developer",
    "analyst",
    "manager",
    "scientist",
    "specialist",
    "designer",
    "administrator",
    "architect",
    "researcher",
    "advocate",
    "writer",
    "tester",
    "it",
    "senior",
}

_SOFT_SKILLS = {
    "Communication",
    "Leadership",
    "Stakeholder Management",
    "Presentation Skills",
    "Public Speaking",
    "Problem Solving",
    "Research",
    "Security",
    "Writing",
}


def _terms(text: str) -> set[str]:
    return {t for t in re.findall(r"[a-z0-9+#]+", text.lower()) if t not in _STOP}


class CourseRecommender:
    def __init__(self, path: Path):
        df = pd.read_csv(path).rename(columns={"level, type and duration": "level"})
        df["skills"] = df["skills"].fillna("")
        df["ratings"] = pd.to_numeric(df["ratings"], errors="coerce").fillna(4.0)
        df = df.drop_duplicates("title")
        df = df[df["title"].map(str.isascii)].reset_index(drop=True)  # English-language catalogue
        self.df = df
        self._title_terms = [_terms(t) for t in df["title"]]
        self._records = [
            {"title": r.title, "provider": r.course_by, "url": r.url, "rating": float(r.ratings), "level": str(r.level)}
            for r in df.itertuples()
        ]
        # Inverted index: title term -> course row ids, so a lookup touches only candidate courses.
        self._index: dict[str, set[int]] = {}
        for i, terms in enumerate(self._title_terms):
            for t in terms:
                self._index.setdefault(t, set()).add(i)

    def search(self, query: str, top_n: int = 2, exclude: set[str] | None = None) -> list[dict]:
        q_terms = _terms(query)
        if not q_terms:
            return []
        candidates = set.intersection(*(self._index.get(t, set()) for t in q_terms))
        scored = []
        for i in candidates:
            course = self._records[i]
            if exclude and course["title"] in exclude:
                continue
            score = 1.0 - 0.05 * len(self._title_terms[i] - q_terms)
            scored.append((score * (0.8 + 0.2 * course["rating"] / 5.0), i))
        scored.sort(key=lambda t: (-t[0], t[1]))
        return [dict(self._records[i]) for _, i in scored[:top_n]]

    def for_skill_gaps(self, missing_skills: list[str], career_title: str, top_n: int = 4) -> list[dict]:
        """Recommend courses that close the most important gaps first, then general career courses."""
        picked: list[dict] = []
        seen: set[str] = set()
        for skill in missing_skills:
            if skill in _SOFT_SKILLS:
                continue
            for course in self.search(skill, top_n=1, exclude=seen):
                picked.append({**course, "skill": skill})
                seen.add(course["title"])
            if len(picked) >= top_n:
                return picked
        domain = [w for w in career_title.replace("/", " ").split() if w.lower() not in _ROLE_WORDS]
        for course in self.search(" ".join(domain), top_n=top_n - len(picked), exclude=seen):
            picked.append({**course, "skill": career_title})
        return picked
