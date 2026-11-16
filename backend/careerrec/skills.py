"""Dictionary/regex based skill extraction with alias normalisation.

Free text such as ``"python, sklearn, k8s and some ML"`` is mapped onto the
canonical skill taxonomy (``Python``, ``Scikit-learn``, ``Kubernetes``,
``Machine Learning``). Longest surface forms are matched first so that
``"objective-c"`` is not read as ``"C"``.
"""

from __future__ import annotations

import re
from collections.abc import Iterable

# Skills whose surface form is also a common English word or letter. They are only
# accepted when written with an upper-case first letter (e.g. "Go", "C", "R").
_AMBIGUOUS = {"go", "c", "r", "excel", "rest", "shell", "spark", "node", "ar", "vr", "cv", "ui", "tf", "ts"}


def _normalise(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip().lower())


class SkillExtractor:
    def __init__(self, vocabulary: Iterable[str], aliases: dict[str, list[str]] | None = None):
        self._surface_to_canonical: dict[str, str] = {}
        for skill in vocabulary:
            self._surface_to_canonical[_normalise(skill)] = skill
        for canonical, forms in (aliases or {}).items():
            for form in forms:
                self._surface_to_canonical.setdefault(_normalise(form), canonical)
            self._surface_to_canonical.setdefault(_normalise(canonical), canonical)

        forms = sorted(self._surface_to_canonical, key=len, reverse=True)
        pattern = "|".join(re.escape(f) for f in forms)
        # Custom word boundaries so that tokens like "c++", "c#" and "node.js" work.
        self._regex = re.compile(rf"(?<![\w+#])({pattern})(?![\w+#]|\.\w)", re.IGNORECASE)

    @property
    def vocabulary(self) -> set[str]:
        return set(self._surface_to_canonical.values())

    def extract(self, text: str | Iterable[str]) -> list[str]:
        """Return canonical skills in order of first appearance (deduplicated)."""
        if not isinstance(text, str):
            text = ", ".join(text)
        found: list[str] = []
        seen: set[str] = set()
        for match in self._regex.finditer(text):
            surface = match.group(1)
            key = _normalise(surface)
            if key in _AMBIGUOUS and not surface[0].isupper():
                continue
            canonical = self._surface_to_canonical[key]
            if canonical not in seen:
                seen.add(canonical)
                found.append(canonical)
        return found
