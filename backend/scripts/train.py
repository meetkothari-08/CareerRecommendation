"""Train, tune and compare all recommendation models, then save the best one.

Pipeline
1. Stage-1 skill classifier: quality measured on 20% held-out postings, then refit on all postings.
2. Two-tower neural recommender (PyTorch): Optuna-tuned on the validation profiles;
   5-fold out-of-fold scores on the training profiles feed the ranker without leakage.
3. Stage-2 rankers on 2,000 training profiles: logistic regression, LightGBM
   LambdaMART, and LambdaMART + two-tower features (LightGBM tuned with Optuna).
4. Model selection on the 400 validation profiles; final report on the 100 untouched
   test profiles. Every run is logged to MLflow (./mlruns) when MLflow is installed.

Usage:
    python -m scripts.train            # full run (~5 min on a laptop CPU)
    python -m scripts.train --fast     # fewer tuning trials (CI)
Outputs: models/career_recommender.joblib, models/metrics.json
"""

from __future__ import annotations

import argparse
import importlib.util
import itertools
import json
import logging
import time

import numpy as np
import scipy.sparse as sp
from sklearn.metrics import accuracy_score, f1_score
from sklearn.model_selection import KFold, train_test_split

from careerrec import paths
from careerrec.data import load_careers, load_postings, load_profiles
from careerrec.evaluation import evaluate_rankings
from careerrec.rankers import LambdaMARTRanker, LogisticRanker
from careerrec.recommender import SIGNALS, CareerRecommender, graded_labels, profile_from_dict
from careerrec.tracking import Tracker
from careerrec.training import build_extractor

log = logging.getLogger("train")
HAS_TORCH = importlib.util.find_spec("torch") is not None
HAS_LGBM = importlib.util.find_spec("lightgbm") is not None
HAS_OPTUNA = importlib.util.find_spec("optuna") is not None


# ---------------------------------------------------------------------------- helpers
def metrics_from_scores(model: CareerRecommender, scores: np.ndarray, profiles: list[dict]) -> dict:
    return evaluate_rankings([[model.ids[i] for i in np.argsort(-row)] for row in scores], profiles)


def objective(m: dict) -> float:
    """Model-selection objective: ranking quality + top-3 relevance."""
    return m["ndcg@5"] + m["relevance@3"]


def tune_linear_weights(model, signals, profiles, step=0.05) -> dict:
    n = int(round(1 / step))
    best, best_obj = None, -1.0
    for a, b, c in itertools.product(range(n + 1), repeat=3):
        d = n - a - b - c
        if 0 <= d <= 2:
            w = dict(zip(SIGNALS, (a * step, b * step, c * step, d * step)))
            o = objective(metrics_from_scores(model, np.array([model.linear_score(s, w) for s in signals]), profiles))
            if o > best_obj:
                best, best_obj = w, o
    return {k: round(v, 2) for k, v in best.items()}


class Split:
    """Precomputed stage-1 signals, neural inputs and labels for one profile split."""

    def __init__(self, model: CareerRecommender, profiles: list[dict]):
        self.profiles = profiles
        self.signals = [model.signals(profile_from_dict(p)) for p in profiles]
        self.X_nn = sp.vstack([s["nn_input"] for s in self.signals]).tocsr().astype(np.float32)
        self.y = np.array([graded_labels(p, model.ids) for p in profiles])
        self.groups = [len(model.ids)] * len(profiles)

    def features(self, model: CareerRecommender, nn_scores: np.ndarray | None = None) -> np.ndarray:
        return np.vstack(
            [model.features(s, None if nn_scores is None else nn_scores[i]) for i, s in enumerate(self.signals)]
        )

    def signal_matrix(self, name: str) -> np.ndarray:
        return np.array([s[name] for s in self.signals])


# ---------------------------------------------------------------------------- two-tower
def train_neural(model, postings, train: Split, val: Split, n_trials: int, tracker: Tracker):
    import optuna

    from careerrec.neural import TwoTowerConfig, soft_targets, train_two_tower

    X_post, y_post = model.posting_inputs(postings)
    cf = model.career_features()
    Y_train = soft_targets(train.profiles, model.ids)

    def val_eval(scores):
        return objective(metrics_from_scores(model, scores, val.profiles))

    def fit(cfg, X, Y):
        return train_two_tower(X, Y, X_post, y_post, cf, model.n_skill_features, cfg, val.X_nn, val_eval)

    def trial_fn(trial):
        cfg = TwoTowerConfig(
            embedding_dim=trial.suggest_categorical("embedding_dim", [32, 64, 128]),
            hidden_dim=trial.suggest_categorical("hidden_dim", [128, 256, 512]),
            dropout=trial.suggest_float("dropout", 0.0, 0.5),
            temperature=trial.suggest_float("temperature", 0.03, 0.2, log=True),
            lr=trial.suggest_float("lr", 3e-4, 5e-3, log=True),
            skill_dropout=trial.suggest_float("skill_dropout", 0.0, 0.4),
            posting_weight=trial.suggest_float("posting_weight", 0.1, 1.0),
        )
        nn, history = fit(cfg, train.X_nn, Y_train)
        best = max(h["val_score"] for h in history)
        with tracker.run(f"two_tower_trial_{trial.number}", cfg.to_dict(), {"stage": "tuning", "model": "two_tower"}):
            tracker.log_metrics({"val_objective": best, "epochs": len(history)})
        return best

    study = optuna.create_study(direction="maximize", sampler=optuna.samplers.TPESampler(seed=42))
    study.optimize(trial_fn, n_trials=n_trials)
    cfg = TwoTowerConfig(**study.best_params)
    log.info("two-tower best params: %s (val objective %.4f)", study.best_params, study.best_value)

    # Out-of-fold scores for the ranker's training rows (avoids target leakage).
    oof = np.zeros((len(train.profiles), len(model.ids)))
    for fold, (tr, ho) in enumerate(KFold(5, shuffle=True, random_state=42).split(train.profiles)):
        nn_fold, _ = fit(cfg, train.X_nn[tr], Y_train[tr])
        oof[ho] = nn_fold.scores(train.X_nn[ho])
        log.info("two-tower OOF fold %d done", fold + 1)

    nn, history = fit(cfg, train.X_nn, Y_train)
    return nn, oof, cfg, history


# ---------------------------------------------------------------------------- LambdaMART
def tune_lambdamart(F_train, train: Split, F_val, val: Split, model, names, n_trials, tracker, label):
    import optuna

    valid = (F_val, val.y.ravel(), val.groups)

    def fit(params):
        return LambdaMARTRanker(num_boost_round=1000, **params).fit(
            F_train, train.y.ravel(), train.groups, feature_names=names, valid=valid
        )

    def trial_fn(trial):
        params = {
            "learning_rate": trial.suggest_float("learning_rate", 0.01, 0.2, log=True),
            "num_leaves": trial.suggest_int("num_leaves", 7, 63),
            "min_data_in_leaf": trial.suggest_int("min_data_in_leaf", 10, 300, log=True),
            "feature_fraction": trial.suggest_float("feature_fraction", 0.5, 1.0),
            "lambda_l2": trial.suggest_float("lambda_l2", 1e-3, 10.0, log=True),
        }
        ranker = fit(params)
        score = objective(metrics_from_scores(model, ranker.predict(F_val).reshape(-1, len(model.ids)), val.profiles))
        with tracker.run(f"{label}_trial_{trial.number}", params, {"stage": "tuning", "model": label}):
            tracker.log_metrics({"val_objective": score, "best_iteration": ranker.booster.best_iteration})
        return score

    study = optuna.create_study(direction="maximize", sampler=optuna.samplers.TPESampler(seed=42))
    study.optimize(trial_fn, n_trials=n_trials)
    log.info("%s best params: %s (val objective %.4f)", label, study.best_params, study.best_value)
    return fit(study.best_params)


# ---------------------------------------------------------------------------- main
def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--fast", action="store_true", help="few tuning trials (for CI)")
    parser.add_argument("--nn-trials", type=int, default=12)
    parser.add_argument("--lgb-trials", type=int, default=25)
    parser.add_argument("--no-mlflow", action="store_true")
    args = parser.parse_args()
    if args.fast:
        args.nn_trials, args.lgb_trials = 2, 4
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s: %(message)s", datefmt="%H:%M:%S")
    logging.getLogger("optuna").setLevel(logging.WARNING)
    t0 = time.time()

    careers = load_careers()
    postings = load_postings()
    extractor = build_extractor(careers)
    tracker = Tracker(enabled=not args.no_mlflow)

    # 1) Stage-1 classifier quality on held-out postings, then refit on everything.
    train_df, hold_df = train_test_split(postings, test_size=0.2, stratify=postings["career_id"], random_state=42)
    probe = CareerRecommender(careers, extractor).fit(train_df)
    y_hold = hold_df["career_id"].map(probe.career_index)
    y_pred = probe.classifier.predict(probe.skill_matrix(list(hold_df["skills"])))
    clf_metrics = {
        "accuracy": round(accuracy_score(y_hold, y_pred), 4),
        "macro_f1": round(f1_score(y_hold, y_pred, average="macro"), 4),
        "holdout_postings": int(len(hold_df)),
    }
    log.info("stage-1 skill classifier: %s", clf_metrics)
    model = CareerRecommender(careers, extractor).fit(postings)

    train = Split(model, load_profiles(paths.TRAIN_PROFILES_PATH))
    val = Split(model, load_profiles(paths.VAL_PROFILES_PATH))
    test = Split(model, load_profiles(paths.TEST_PROFILES_PATH))
    log.info("profiles: %d train / %d val / %d test", len(train.profiles), len(val.profiles), len(test.profiles))

    results: dict[str, dict] = {}
    candidates: dict[str, dict] = {}  # learned models eligible for selection
    test_scores: dict[str, np.ndarray] = {}

    def record(name, val_scores, te_scores, params=None, learned=None):
        test_scores[name] = te_scores
        results[name] = {
            "val": metrics_from_scores(model, val_scores, val.profiles),
            "test": metrics_from_scores(model, te_scores, test.profiles),
        }
        with tracker.run(name, params, {"stage": "comparison"}):
            tracker.log_metrics(results[name]["val"], "val_")
            tracker.log_metrics(results[name]["test"], "test_")
        if learned is not None:
            candidates[name] = learned
        log.info(
            "%-40s val rel@3=%.3f ndcg@5=%.3f | test rel@3=%.3f ndcg@5=%.3f",
            name,
            results[name]["val"]["relevance@3"],
            results[name]["val"]["ndcg@5"],
            results[name]["test"]["relevance@3"],
            results[name]["test"]["ndcg@5"],
        )

    # 2) Baselines and single signals.
    for name, sig in [
        ("Rule-based skill overlap (baseline)", "taxonomy_jaccard"),
        ("Interest similarity only", "interest_similarity"),
        ("Market skill similarity only", "skill_similarity"),
        ("Skill classifier only", "classifier"),
    ]:
        record(name, val.signal_matrix(sig), test.signal_matrix(sig))
    weights = tune_linear_weights(model, val.signals, val.profiles)
    model.weights = weights
    record(
        "Linear blend (grid-tuned)",
        np.array([model.linear_score(s) for s in val.signals]),
        np.array([model.linear_score(s) for s in test.signals]),
        weights,
    )

    # 3) Two-tower neural recommender.
    nn = oof = nn_cfg = nn_history = None
    if HAS_TORCH and HAS_OPTUNA:
        nn, oof, nn_cfg, nn_history = train_neural(model, postings, train, val, args.nn_trials, tracker)
        nn_val, nn_test = nn.scores(val.X_nn), nn.scores(test.X_nn)
        record("Two-tower neural network (PyTorch)", nn_val, nn_test, nn_cfg.to_dict())
    else:
        log.warning(
            "PyTorch/Optuna not installed - skipping the two-tower model (pip install -r requirements-train.txt)"
        )

    # 4) Stage-2 rankers.
    names = model.feature_names()
    F_tr, F_va, F_te = train.features(model), val.features(model), test.features(model)
    logistic = LogisticRanker().fit(F_tr, train.y.ravel())
    n = len(model.ids)
    record(
        "Logistic-regression ranker",
        logistic.predict(F_va).reshape(-1, n),
        logistic.predict(F_te).reshape(-1, n),
        logistic.params(),
        {"ranker": logistic, "nn": False},
    )

    importance = {}
    if HAS_LGBM and HAS_OPTUNA:
        lm = tune_lambdamart(F_tr, train, F_va, val, model, names, args.lgb_trials, tracker, "lambdamart")
        record(
            "LightGBM LambdaMART ranker",
            lm.predict(F_va).reshape(-1, n),
            lm.predict(F_te).reshape(-1, n),
            lm.params(),
            {"ranker": lm, "nn": False},
        )
        importance["LightGBM LambdaMART ranker"] = lm.feature_importance(names)
        if nn is not None:
            names_nn = names + ["two_tower_score", "two_tower_reciprocal_rank"]
            Fn_tr, Fn_va, Fn_te = train.features(model, oof), val.features(model, nn_val), test.features(model, nn_test)
            lmn = tune_lambdamart(Fn_tr, train, Fn_va, val, model, names_nn, args.lgb_trials, tracker, "lambdamart_nn")
            record(
                "LambdaMART + two-tower (hybrid)",
                lmn.predict(Fn_va).reshape(-1, n),
                lmn.predict(Fn_te).reshape(-1, n),
                lmn.params(),
                {"ranker": lmn, "nn": True},
            )
            importance["LambdaMART + two-tower (hybrid)"] = lmn.feature_importance(names_nn)
    else:
        log.warning("LightGBM/Optuna not installed - skipping LambdaMART rankers")

    # 5) Select the best learned model on VALIDATION (never on test) and save it.
    selected = max(candidates, key=lambda k: objective(results[k]["val"]))
    choice = candidates[selected]
    model.two_tower = nn
    model.set_ranker(choice["ranker"], uses_two_tower=choice["nn"], name=selected)
    model.save(paths.MODEL_PATH)
    log.info("selected model (by validation): %s", selected)

    final = results[selected]["test"]
    metrics = {
        "dataset": {
            "job_postings": int(len(postings)),
            "careers": len(careers),
            "skills_in_taxonomy": len(extractor.vocabulary),
            "companies": int(postings["company"].nunique()),
            "train_profiles": len(train.profiles),
            "validation_profiles": len(val.profiles),
            "test_profiles": len(test.profiles),
        },
        "selected_model": selected,
        "headline": {
            "metric": "relevance@3",
            "value": final["relevance@3"],
            "description": "Relevant careers in the top 3 divided by the best achievable, averaged over the "
            "100 held-out test profiles. A career is relevant if it is the profile's primary "
            "career, its blended/previous career, a natural next role, or a related career (skill Jaccard "
            ">= 0.25 and overlapping interests). "
            "The production model is selected on the validation profiles.",
        },
        "test": final,
        "test_by_profile_type": {
            kind: {
                "profiles": len(idx),
                **metrics_from_scores(model, test_scores[selected][idx], [test.profiles[i] for i in idx]),
            }
            for kind in sorted({p["profile_type"] for p in test.profiles})
            for idx in [[i for i, p in enumerate(test.profiles) if p["profile_type"] == kind]]
        },
        "ablation": {k: v["test"] for k, v in results.items()},
        "validation": {k: v["val"] for k, v in results.items()},
        "feature_importance": importance,
        "stage1_classifier": clf_metrics,
        "two_tower": None
        if nn is None
        else {
            "config": nn_cfg.to_dict(),
            "epochs_trained": len(nn_history),
            "parameters": int(nn.w1.size + nn.b1.size + nn.w2.size + nn.b2.size),
        },
        "linear_blend_weights": weights,
        "training_seconds": round(time.time() - t0, 1),
    }
    paths.METRICS_PATH.write_text(json.dumps(metrics, indent=2))
    with tracker.run("selected_model", {"selected": selected}, {"stage": "final"}):
        tracker.log_metrics(final, "test_")
        tracker.log_dict(metrics, "metrics.json")

    print(
        f"\n{'model':42s}{'val rel@3':>11s}{'val ndcg@5':>12s}{'test rel@3':>12s}{'test ndcg@5':>13s}{'test top1':>11s}"
    )
    for name, r in results.items():
        mark = "  <- selected" if name == selected else ""
        print(
            f"{name:42s}{r['val']['relevance@3']:11.3f}{r['val']['ndcg@5']:12.3f}"
            f"{r['test']['relevance@3']:12.3f}{r['test']['ndcg@5']:13.3f}{r['test']['top1_accuracy']:11.3f}{mark}"
        )
    print(f"\nsaved model -> {paths.MODEL_PATH}\nsaved metrics -> {paths.METRICS_PATH}  ({time.time() - t0:.0f}s)")


if __name__ == "__main__":
    main()
