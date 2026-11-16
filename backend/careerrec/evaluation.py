"""Offline ranking metrics for the recommender."""

from __future__ import annotations

import math
from collections.abc import Callable, Sequence

import numpy as np


def precision_at_k(ranked: Sequence[str], relevant: set[str], k: int) -> float:
    return sum(1 for r in ranked[:k] if r in relevant) / k


def normalized_relevance_at_k(ranked: Sequence[str], relevant: set[str], k: int) -> float:
    """Relevant items in the top-k divided by the best achievable (min(k, |relevant|))."""
    return sum(1 for r in ranked[:k] if r in relevant) / min(k, len(relevant))


def hit_at_k(ranked: Sequence[str], target: str, k: int) -> float:
    return float(target in ranked[:k])


def reciprocal_rank(ranked: Sequence[str], target: str) -> float:
    return 1.0 / (list(ranked).index(target) + 1) if target in ranked else 0.0


def ndcg_at_k(ranked: Sequence[str], target: str, relevant: set[str], k: int) -> float:
    """Graded NDCG: the profile's primary career has gain 2, acceptable alternatives gain 1."""

    def gain(c: str) -> float:
        return 2.0 if c == target else (1.0 if c in relevant else 0.0)

    dcg = sum(gain(c) / math.log2(i + 2) for i, c in enumerate(ranked[:k]))
    ideal = sorted((gain(c) for c in relevant | {target}), reverse=True)[:k]
    idcg = sum(g / math.log2(i + 2) for i, g in enumerate(ideal))
    return dcg / idcg if idcg else 0.0


def evaluate_rankings(rankings: list[Sequence[str]], profiles: list[dict]) -> dict[str, float]:
    m: dict[str, list[float]] = {
        k: [] for k in ["relevance@3", "precision@3", "precision@5", "top1_accuracy", "hit@3", "hit@5", "mrr", "ndcg@5"]
    }
    for ranked, p in zip(rankings, profiles):
        relevant, target = set(p["relevant"]), p["target"]
        m["relevance@3"].append(normalized_relevance_at_k(ranked, relevant, 3))
        m["precision@3"].append(precision_at_k(ranked, relevant, 3))
        m["precision@5"].append(precision_at_k(ranked, relevant, 5))
        m["top1_accuracy"].append(hit_at_k(ranked, target, 1))
        m["hit@3"].append(hit_at_k(ranked, target, 3))
        m["hit@5"].append(hit_at_k(ranked, target, 5))
        m["mrr"].append(reciprocal_rank(ranked, target))
        m["ndcg@5"].append(ndcg_at_k(ranked, target, relevant, 5))
    return {k: round(float(np.mean(v)), 4) for k, v in m.items()}


def evaluate(rank_fn: Callable[[dict], Sequence[str]], profiles: list[dict]) -> dict[str, float]:
    return evaluate_rankings([rank_fn(p) for p in profiles], profiles)
