"""Train the two-stage recommender and evaluate it on 100 held-out profiles.

Steps
1. Hold out 20% of job postings to measure the stage-1 skill classifier.
2. Fit stage 1 on all postings.
3. Fit the stage-2 learned ranker on the 400 validation profiles.
4. Evaluate on the 100 untouched test profiles, with an ablation of every signal
   and a rule-based baseline.

Usage:  python -m scripts.train
Outputs: models/career_recommender.joblib, models/metrics.json
"""

from __future__ import annotations

import itertools
import json

import numpy as np
from sklearn.metrics import accuracy_score, f1_score
from sklearn.model_selection import train_test_split

from careerrec import paths
from careerrec.data import load_careers, load_postings, load_profiles
from careerrec.evaluation import evaluate_rankings
from careerrec.recommender import SIGNALS, CareerRecommender, UserProfile
from careerrec.training import build_extractor, train_recommender


def to_profile(p: dict) -> UserProfile:
    return UserProfile(p["skills"], p["interests"], p["education"], p["experience_years"], p["goals"])


def ranked(model: CareerRecommender, scores: np.ndarray) -> list[str]:
    return [model.ids[i] for i in np.argsort(-scores)]


def tune_linear_weights(model: CareerRecommender, signals: list[dict], profiles: list[dict], step: float = 0.05):
    """Grid-search the simplex of blend weights (baseline for the learned ranker)."""
    n = int(round(1 / step))
    best, best_obj = None, -1.0
    for a, b, c in itertools.product(range(n + 1), repeat=3):
        d = n - a - b - c
        if d < 0 or d > 2:
            continue
        w = dict(zip(SIGNALS, (a * step, b * step, c * step, d * step)))
        m = evaluate_rankings([ranked(model, model.linear_score(s, w)) for s in signals], profiles)
        if m["ndcg@5"] + m["relevance@3"] > best_obj:
            best, best_obj = w, m["ndcg@5"] + m["relevance@3"]
    return {k: round(v, 2) for k, v in best.items()}


def main() -> None:
    careers = load_careers()
    postings = load_postings()
    val = load_profiles(paths.VAL_PROFILES_PATH)
    test = load_profiles(paths.TEST_PROFILES_PATH)
    extractor = build_extractor(careers)

    # 1) Stage-1 classifier quality on held-out postings.
    train_df, hold_df = train_test_split(postings, test_size=0.2, stratify=postings["career_id"], random_state=42)
    probe = CareerRecommender(careers, extractor).fit(train_df)
    y_hold = hold_df["career_id"].map(probe.career_index)
    y_pred = probe.classifier.predict(probe.tfidf.transform(probe.mlb.transform(hold_df["skills"])))
    clf_metrics = {
        "accuracy": round(accuracy_score(y_hold, y_pred), 4),
        "macro_f1": round(f1_score(y_hold, y_pred, average="macro"), 4),
        "holdout_postings": int(len(hold_df)),
    }
    print(f"stage-1 skill classifier on {len(hold_df)} held-out postings: {clf_metrics}")

    # 2-3) Full model: stage 1 on all postings, stage 2 on validation profiles.
    model = train_recommender(careers, postings, val)

    # 4) Evaluation + ablation on the untouched test profiles.
    val_sig = [model.signals(to_profile(p)) for p in val]
    test_sig = [model.signals(to_profile(p)) for p in test]
    weights = tune_linear_weights(model, val_sig, val)

    def only(name):
        return [ranked(model, s[name]) for s in test_sig]

    results = {
        "Rule-based skill overlap (baseline)": evaluate_rankings(only("taxonomy_jaccard"), test),
        "Interest similarity only": evaluate_rankings(only("interest_similarity"), test),
        "Market skill similarity only": evaluate_rankings(only("skill_similarity"), test),
        "Skill classifier only": evaluate_rankings(only("classifier"), test),
        "Linear blend (grid-tuned)": evaluate_rankings(
            [ranked(model, model.linear_score(s, weights)) for s in test_sig], test
        ),
        "Two-stage hybrid (learned ranker)": evaluate_rankings([ranked(model, model.score(s)) for s in test_sig], test),
    }
    print(f"\n{'model':38s}" + "".join(f"{k:>14s}" for k in next(iter(results.values()))))
    for name, m in results.items():
        print(f"{name:38s}" + "".join(f"{v:14.3f}" for v in m.values()))

    final = results["Two-stage hybrid (learned ranker)"]
    by_type = {}
    for kind in sorted({p["profile_type"] for p in test}):
        idx = [i for i, p in enumerate(test) if p["profile_type"] == kind]
        by_type[kind] = {
            "profiles": len(idx),
            **evaluate_rankings([ranked(model, model.score(test_sig[i])) for i in idx], [test[i] for i in idx]),
        }

    model.weights = weights
    model.save(paths.MODEL_PATH)
    metrics = {
        "dataset": {
            "job_postings": int(len(postings)),
            "careers": len(careers),
            "skills_in_taxonomy": len(extractor.vocabulary),
            "companies": int(postings["company"].nunique()),
            "ranker_training_profiles": len(val),
            "test_profiles": len(test),
        },
        "headline": {
            "metric": "relevance@3",
            "value": final["relevance@3"],
            "description": "Relevant careers in the top 3 divided by the best achievable, averaged over the "
            "100 held-out test profiles. A career is relevant if it is the profile's primary "
            "career, its blended/previous career, or closely related (skill Jaccard >= 0.25).",
        },
        "test": final,
        "test_by_profile_type": by_type,
        "ablation": results,
        "stage1_classifier": clf_metrics,
        "linear_blend_weights": weights,
    }
    paths.METRICS_PATH.write_text(json.dumps(metrics, indent=2))
    print(f"\nsaved model -> {paths.MODEL_PATH}\nsaved metrics -> {paths.METRICS_PATH}")


if __name__ == "__main__":
    main()
