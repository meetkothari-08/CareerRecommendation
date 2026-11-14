"""Local API for career guidance and job-market exploration.

External API credentials stay on the server. The archived LSTM artifact is not
used for predictions because its original preprocessing/class labels have not
been validated against the current questionnaire.
"""
import os
import re
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import requests
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS

load_dotenv(Path(__file__).resolve().parent / ".env")
app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 32 * 1024
allowed_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
    if origin.strip()
]
CORS(app, resources={r"/api/*": {"origins": allowed_origins}})

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
ADZUNA_URL = "https://api.adzuna.com/v1/api/jobs"
COUNTRIES = ("us", "gb", "au", "de", "ca", "nl", "fr", "it", "br", "in")
SYSTEM_PROMPT = (
    "You are a career guidance assistant. Provide specific, realistic, "
    "actionable career advice. Do not invent personalized statistical confidence "
    "scores, live labor-market data, or guarantees."
)


class ServiceError(Exception):
    def __init__(self, message, status=502):
        super().__init__(message)
        self.status = status


def require_json():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        raise ServiceError("A JSON object is required.", 400)
    return data


def groq_completion(messages):
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ServiceError("Groq is not configured on this server.", 503)

    try:
        response = requests.post(
            GROQ_URL,
            headers={"Authorization": f"Bearer {api_key}"},
            json={
                "model": os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
                "messages": [{"role": "system", "content": SYSTEM_PROMPT}, *messages],
                "temperature": 0.5,
                "max_tokens": 1200,
            },
            timeout=40,
        )
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"]
    except (requests.RequestException, KeyError, IndexError, TypeError, ValueError) as exc:
        app.logger.warning("Career AI provider request failed: %s", type(exc).__name__)
        raise ServiceError("Career guidance provider is temporarily unavailable.") from exc


def adzuna(path, country="us", title=""):
    app_id = os.getenv("ADZUNA_APP_ID")
    app_key = os.getenv("ADZUNA_APP_KEY")
    if not app_id or not app_key:
        raise ServiceError("Job market data is not configured on this server.", 503)
    if country not in COUNTRIES:
        raise ServiceError("Unsupported country.", 400)
    try:
        response = requests.get(
            f"{ADZUNA_URL}/{country}/{path}",
            params={"app_id": app_id, "app_key": app_key, "what": title},
            timeout=15,
        )
        response.raise_for_status()
        return response.json()
    except (requests.RequestException, ValueError) as exc:
        app.logger.warning("Job market provider request failed: %s", type(exc).__name__)
        raise ServiceError("Job market provider is temporarily unavailable.") from exc


def requested_title():
    title = request.args.get("title", "").strip()
    if not title or len(title) > 120:
        raise ServiceError("Provide a job title (up to 120 characters).", 400)
    return title


@app.errorhandler(ServiceError)
def service_error(exc):
    return jsonify({"error": str(exc)}), exc.status


@app.route("/api/health")
def health():
    return jsonify({"status": "ok", "aiConfigured": bool(os.getenv("GROQ_API_KEY")),
                    "marketConfigured": bool(os.getenv("ADZUNA_APP_ID") and os.getenv("ADZUNA_APP_KEY"))})


@app.route("/api/recommendations", methods=["POST"])
def recommend():
    profile = require_json()
    fields = ("skills", "interests", "experience", "education", "goals")
    if any(not isinstance(profile.get(key), str) or not profile[key].strip()
           or len(profile[key]) > 1000 for key in fields):
        raise ServiceError("Provide all five profile fields (up to 1,000 characters each).", 400)

    prompt = (
        "Recommend 3-5 realistic career directions for this profile. For each, "
        "explain the fit and skills to build, then offer concrete next steps. "
        "Do not return fabricated percentages.\n\n"
        + "\n".join(f"{field.title()}: {profile[field]}" for field in fields)
    )
    advice = groq_completion([{"role": "user", "content": prompt}])
    return jsonify({"method": "generative-ai", "recommendations": advice})


@app.route("/api/chat", methods=["POST"])
def chat():
    data = require_json()
    history = data.get("messages")
    if not isinstance(history, list) or not history or len(history) > 20:
        raise ServiceError("Provide between 1 and 20 chat messages.", 400)
    cleaned = []
    for message in history:
        if (not isinstance(message, dict)
                or message.get("role") not in ("user", "assistant")
                or not isinstance(message.get("content"), str)
                or not message["content"].strip()
                or len(message["content"]) > 3000):
            raise ServiceError("Invalid chat message.", 400)
        cleaned.append({"role": message["role"], "content": message["content"]})
    if cleaned[-1]["role"] != "user":
        raise ServiceError("The last chat message must be from the user.", 400)
    return jsonify({"message": groq_completion(cleaned)})


@app.route("/api/market/history")
def market_history():
    return jsonify(adzuna("history", title=requested_title(),
                          country=request.args.get("country", "us").lower()))


@app.route("/api/market/histogram")
def market_histogram():
    return jsonify(adzuna("histogram", title=requested_title(),
                          country=request.args.get("country", "us").lower()))


@app.route("/api/market/demand")
def market_demand():
    title = requested_title()

    def country_count(country):
        try:
            data = adzuna("search/1", title=title, country=country)
            return {"country": country.upper(), "count": int(data.get("count", 0))}
        except ServiceError:
            return None

    with ThreadPoolExecutor(max_workers=5) as pool:
        results = list(pool.map(country_count, COUNTRIES))
    valid = [result for result in results if result is not None]
    if not valid:
        raise ServiceError("No job market data is available.", 502)
    return jsonify(valid)


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=int(os.getenv("FLASK_PORT", "5000")),
            debug=os.getenv("FLASK_DEBUG", "false").lower() == "true")
