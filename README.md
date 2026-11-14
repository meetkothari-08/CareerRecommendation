# Career Recommendation System

A full-stack career guidance prototype that uses a structured skills-and-interests questionnaire, generative AI, a curated career knowledge base, course matching, and job-market visualizations to help users explore possible career directions.

> **Portfolio status:** This repository is a prototype, not a validated career-prediction or production counseling service. Its AI answers are suggestions, not guaranteed outcomes. The original LSTM model file is retained as a research artifact but is **not** used in the current recommendation flow: compatible training preprocessing, model labels, and evaluation results are not documented.

## Features

- **Career guidance:** Collects education, skills, interests, experience, and goals to request personalized career suggestions from an AI provider.
- **Career chatbot:** Conversational career guidance with a small curated knowledge base.
- **Course discovery:** Matches skill keywords to a local Coursera course catalog (simple filtering, **not** a trained recommender).
- **Job market dashboard:** Displays Adzuna job history, salary histogram, and cross-country posting counts when server credentials are configured.
- **Profile prototype:** Includes a profile UI and a separate Express/MongoDB API (requires local MongoDB; authentication is not implemented).

## Technology

| Layer | Tools |
| --- | --- |
| Frontend | React, TypeScript, Vite, Tailwind CSS, Recharts |
| Career guidance API | Python, Flask, Groq-compatible chat completions |
| Market data | Adzuna API, proxied through Flask |
| Profile prototype | Node.js, Express, MongoDB / Mongoose |
| Data | Local Coursera CSV and curated career knowledge base |

## Architecture

```text
React + TypeScript (Vite, :5173)
  |-- Career form / chat ---> Flask API (:5000) ---> Groq API
  |-- Market analysis -----> Flask API (:5000) ---> Adzuna API
  |-- Course lookup -------> public/data/coursera.csv
  |-- Profile page --------> Express API (:5001) --> local MongoDB
```

Only the Python backend should receive provider secrets. The Express profile service is optional and is not authenticated; **do not deploy it publicly without authentication and access control**.

## Local setup

Prerequisites: Node.js 20+, Python 3.10+, a Groq API key for AI features, and optional Adzuna credentials for market features.

1. Clone and enter the repository:

   ```bash
   git clone https://github.com/meetkothari-08/CareerRecommendation.git
   cd CareerRecommendation
   ```

2. Install frontend dependencies and create the local frontend configuration:

   ```bash
   npm ci
   cp .env.example .env
   npm run dev
   ```

   On Windows PowerShell, use `Copy-Item .env.example .env` instead of `cp` if needed.

3. In a **second terminal**, configure and start the Python API:

   ```bash
   cd backend
   python -m venv .venv
   # macOS/Linux:
   source .venv/bin/activate
   # Windows PowerShell:
   # .venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   cp .env.example .env
   python app.py
   ```

   Put your **newly issued** Groq key and optional Adzuna credentials in `backend/.env`. Never commit that file. Check `http://localhost:5000/api/health` for configuration status. The UI runs at `http://localhost:5173`.

4. **Optional profile storage:** Run a local MongoDB server, then in a third terminal:

   ```bash
   cd backend
   npm ci
   npm start
   ```

   Express listens on port `5001` by default. The profile UI currently uses a demonstration user ID and has no login/authentication.

## Environment variables

| Location | Variable | Purpose |
| --- | --- | --- |
| `backend/.env` | `GROQ_API_KEY` | **Secret** for recommendations and chat |
| `backend/.env` | `ADZUNA_APP_ID`, `ADZUNA_APP_KEY` | **Secret** provider credentials for market charts |
| `backend/.env` | `GROQ_MODEL` | Optional chat model name |
| `backend/.env` | `CORS_ORIGINS` | Comma-separated permitted frontend origins |
| root `.env` | `VITE_API_BASE_URL` | Non-secret Python API endpoint |

**Security:** Older versions of this repo contained provider keys in client code. Rotate the affected Gemini and Adzuna credentials before using or publishing this project. Removing keys from the latest files does **not** remove them from Git history. Avoid public deployment until rotation and history review are complete.

## APIs

- `GET /api/health` — local configuration/health status.
- `POST /api/recommendations` — five text fields: `skills`, `interests`, `experience`, `education`, `goals`; returns `method` and `recommendations`.
- `POST /api/chat` — `{ "messages": [{ "role": "user", "content": "..." }] }`; returns `message`.
- `GET /api/market/history?title=Data%20Analyst` — Adzuna time-series data.
- `GET /api/market/histogram?title=Data%20Analyst` — Adzuna salary histogram.
- `GET /api/market/demand?title=Data%20Analyst` — counts for configured countries.

## Repository layout

```text
backend/          Flask career/market API; optional Express profile API
src/pages/        Application pages
src/components/   UI components and charts
src/services/     API clients, course and knowledge-base utilities
src/data/         Curated career reference data
public/data/      Course CSV used by the frontend
docs/             Architecture, limitations, and portfolio notes
```

## Verification and limitations

Run `npm run build` to type-check and build the frontend, and `npm run lint` to inspect lint issues. Run offline API smoke tests with `cd backend && python -m unittest discover -s tests -v`; Python syntax can be checked with `python -m compileall backend/app.py`. Provider-backed features need valid keys and network access for end-to-end testing. Additional limitations are documented in [docs/PROJECT_NOTES.md](docs/PROJECT_NOTES.md).

## Responsible use

Job-market counts depend on provider coverage, country, and query. Career suggestions are generated text and should be checked against actual job requirements. The prototype does not provide validated probability estimates or personalized placement guarantees.

## License

No license is currently granted. Add a license only after confirming ownership and third-party asset rights.
