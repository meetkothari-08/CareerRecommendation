"""Optional MLflow experiment tracking (no-op when MLflow is not installed)."""

from __future__ import annotations

import contextlib
import logging

from . import paths

log = logging.getLogger(__name__)


class Tracker:
    def __init__(self, experiment: str = "careerrec", enabled: bool = True):
        self.mlflow = None
        if not enabled:
            return
        try:
            import mlflow
        except ImportError:
            log.info("MLflow not installed; experiment tracking disabled")
            return
        paths.MLRUNS_DIR.mkdir(parents=True, exist_ok=True)
        try:
            mlflow.set_tracking_uri(f"sqlite:///{(paths.MLRUNS_DIR / 'mlflow.db').resolve()}")
            mlflow.set_experiment(experiment)
        except Exception as exc:  # tracking must never break training
            log.warning("MLflow tracking disabled: %s", exc)
            return
        self.mlflow = mlflow

    @property
    def enabled(self) -> bool:
        return self.mlflow is not None

    @contextlib.contextmanager
    def run(self, name: str, params: dict | None = None, tags: dict | None = None):
        if not self.enabled:
            yield None
            return
        with self.mlflow.start_run(run_name=name, tags=tags or {}) as run:
            if params:
                self.mlflow.log_params({k: v for k, v in params.items() if v is not None})
            yield run

    def log_metrics(self, metrics: dict, prefix: str = "") -> None:
        if self.enabled:
            self.mlflow.log_metrics({f"{prefix}{k.replace('@', '_at_')}": float(v) for k, v in metrics.items()})

    def log_dict(self, data: dict, name: str) -> None:
        if self.enabled:
            self.mlflow.log_dict(data, name)
