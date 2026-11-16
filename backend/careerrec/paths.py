"""Central place for filesystem locations (overridable via environment variables)."""

import os
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = Path(os.getenv("CAREERREC_DATA_DIR", REPO_ROOT / "data"))
MODELS_DIR = Path(os.getenv("CAREERREC_MODELS_DIR", REPO_ROOT / "models"))

CAREERS_PATH = DATA_DIR / "careers.json"
SKILL_ALIASES_PATH = DATA_DIR / "skill_aliases.json"
POSTINGS_PATH = Path(os.getenv("CAREERREC_POSTINGS", DATA_DIR / "job_postings.csv"))
COURSES_PATH = DATA_DIR / "courses.csv"
TRAIN_PROFILES_PATH = DATA_DIR / "eval" / "train_profiles.json"
VAL_PROFILES_PATH = DATA_DIR / "eval" / "validation_profiles.json"
TEST_PROFILES_PATH = DATA_DIR / "eval" / "test_profiles.json"
SFT_DATASET_PATH = DATA_DIR / "finetune" / "career_advisor_sft.jsonl"

MODEL_PATH = MODELS_DIR / "career_recommender.joblib"
METRICS_PATH = MODELS_DIR / "metrics.json"
MLRUNS_DIR = Path(os.getenv("MLFLOW_TRACKING_DIR", REPO_ROOT / "mlruns"))
