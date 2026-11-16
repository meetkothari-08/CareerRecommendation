PY ?= python

.PHONY: setup data train train-fast mlflow test api web

setup:            ## install backend (incl. CPU PyTorch for training) + frontend dependencies
	cd backend && $(PY) -m pip install torch --index-url https://download.pytorch.org/whl/cpu
	cd backend && $(PY) -m pip install -r requirements-train.txt -r requirements-dev.txt
	cd frontend && npm install

data:             ## regenerate the job-posting snapshot and evaluation profiles
	cd backend && $(PY) -m scripts.generate_data

train:            ## train the recommender and write models/metrics.json
	cd backend && $(PY) -m scripts.train

train-fast:       ## quick training run with few tuning trials
	cd backend && $(PY) -m scripts.train --fast

mlflow:           ## browse experiment runs at http://localhost:5000
	mlflow ui --backend-store-uri sqlite:///mlruns/mlflow.db

test:             ## lint + unit/API tests
	cd backend && ruff check . && pytest -q

api:              ## run the FastAPI server on :8000
	cd backend && uvicorn api.main:app --reload --port 8000

web:              ## run the React dev server on :5173
	cd frontend && npm run dev
