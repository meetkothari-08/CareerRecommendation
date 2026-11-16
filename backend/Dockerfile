# Build from the repository root:  docker build -f backend/Dockerfile -t careerrec-api .
FROM python:3.11-slim
WORKDIR /app
COPY backend/requirements.txt backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt
COPY data data
COPY models models
COPY backend backend
WORKDIR /app/backend
RUN python -m scripts.train
EXPOSE 8000
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
