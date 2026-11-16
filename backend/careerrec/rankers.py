"""Stage-2 rankers that turn per-career feature vectors into a relevance score.

Both rankers share one interface:

* ``fit(X, y, groups)`` - X: (n_rows, n_features), y: graded labels 0/1/2,
  groups: number of candidate rows per profile (56 careers each).
* ``predict(X)`` - calibrated relevance in [0, 1] (shown as the match score).
* ``contributions(X)`` - per-feature contribution to each row's score, used to
  explain recommendations.
"""

from __future__ import annotations

import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler


class LogisticRanker:
    """Pointwise multinomial logistic regression; score = expected graded relevance / 2."""

    name = "logistic"

    def __init__(self, C: float = 1.0):
        self.C = C

    def fit(self, X: np.ndarray, y: np.ndarray, groups: list[int] | None = None) -> LogisticRanker:
        self.scaler = StandardScaler().fit(X)
        self.model = LogisticRegression(C=self.C, max_iter=3000).fit(self.scaler.transform(X), y)
        return self

    def predict(self, X: np.ndarray) -> np.ndarray:
        proba = self.model.predict_proba(self.scaler.transform(X))
        gains = dict(zip(self.model.classes_, proba.T))
        return 0.5 * gains.get(1, 0) + 1.0 * gains.get(2, 0)

    def contributions(self, X: np.ndarray) -> np.ndarray:
        # Contribution of each standardised feature to the "relevant" logits.
        Z = self.scaler.transform(X)
        coef = self.model.coef_
        classes = list(self.model.classes_)
        w = sum(coef[classes.index(c)] * g for c, g in ((1, 0.5), (2, 1.0)) if c in classes)
        return Z * w

    def params(self) -> dict:
        return {"C": self.C}


class LambdaMARTRanker:
    """LightGBM LambdaRank (gradient-boosted trees optimising NDCG), Platt-calibrated to [0, 1]."""

    name = "lambdamart"

    DEFAULTS = {
        "objective": "lambdarank",
        "metric": "ndcg",
        "eval_at": [3, 5],
        "learning_rate": 0.05,
        "num_leaves": 15,
        "min_data_in_leaf": 40,
        "feature_fraction": 0.8,
        "bagging_fraction": 0.8,
        "bagging_freq": 1,
        "lambda_l2": 1.0,
        "verbosity": -1,
        "seed": 42,
        "num_threads": 4,
    }

    def __init__(self, num_boost_round: int = 300, **params):
        self.num_boost_round = num_boost_round
        self.lgb_params = {**self.DEFAULTS, **params}

    def fit(
        self,
        X: np.ndarray,
        y: np.ndarray,
        groups: list[int],
        feature_names: list[str] | None = None,
        valid: tuple[np.ndarray, np.ndarray, list[int]] | None = None,
    ) -> LambdaMARTRanker:
        import lightgbm as lgb

        train = lgb.Dataset(X, label=y, group=groups, feature_name=feature_names or "auto")
        callbacks, valid_sets = [], []
        if valid is not None:
            valid_sets = [lgb.Dataset(valid[0], label=valid[1], group=valid[2], reference=train)]
            callbacks = [lgb.early_stopping(30, verbose=False)]
        self.booster = lgb.train(
            self.lgb_params, train, num_boost_round=self.num_boost_round, valid_sets=valid_sets, callbacks=callbacks
        )
        # Platt scaling: map raw ranking scores to P(relevant) so the UI can show a percentage.
        raw = self.booster.predict(X, num_iteration=self.booster.best_iteration or None)
        self.calibrator = LogisticRegression().fit(raw.reshape(-1, 1), (y > 0).astype(int))
        return self

    def raw(self, X: np.ndarray) -> np.ndarray:
        return self.booster.predict(X, num_iteration=self.booster.best_iteration or None)

    def predict(self, X: np.ndarray) -> np.ndarray:
        return self.calibrator.predict_proba(self.raw(X).reshape(-1, 1))[:, 1]

    def contributions(self, X: np.ndarray) -> np.ndarray:
        # TreeSHAP values from LightGBM (last column is the bias term).
        return self.booster.predict(X, num_iteration=self.booster.best_iteration or None, pred_contrib=True)[:, :-1]

    def feature_importance(self, names: list[str]) -> dict[str, float]:
        gain = self.booster.feature_importance(importance_type="gain")
        total = gain.sum() or 1.0
        return {n: round(float(g / total), 4) for n, g in sorted(zip(names, gain), key=lambda t: -t[1])}

    def params(self) -> dict:
        keep = ("learning_rate", "num_leaves", "min_data_in_leaf", "feature_fraction", "lambda_l2")
        return {**{k: self.lgb_params[k] for k in keep}, "best_iteration": int(self.booster.best_iteration or 0)}
