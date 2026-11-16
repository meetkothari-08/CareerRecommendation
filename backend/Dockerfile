# Build from the repository root:  docker build -f backend/Dockerfile -t careerrec-api .
# Stage 1 trains the full model (PyTorch + LightGBM + Optuna); stage 2 serves it without PyTorch.

FROM python:3.11-slim AS trainer
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends libgomp1 && rm -rf /var/lib/apt/lists/*
COPY backend/requirements.txt backend/requirements-train.txt backend/
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu \
 && pip install --no-cache-dir -r backend/requirements-train.txt
COPY data data
COPY models models
COPY backend backend
WORKDIR /app/backend
RUN python -m scripts.train --no-mlflow

FROM python:3.11-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends libgomp1 && rm -rf /var/lib/apt/lists/*
COPY backend/requirements.txt backend/
RUN pip install --no-cache-dir -r backend/requirements.txt
COPY data data
COPY backend backend
COPY --from=trainer /app/models models
WORKDIR /app/backend
EXPOSE 8000
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
