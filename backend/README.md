# API services

The Python Flask API serves career guidance, chat, and Adzuna market-data proxy endpoints. It is separate from the optional Node/Express MongoDB profile API.

Follow the repository-root [setup guide](../README.md) for prerequisites, local configuration, startup instructions, and endpoint descriptions.

## Service ports

- Python Flask: `5000` (career guidance, chatbot, market data)
- Node Express: `5001` (demo profile storage; MongoDB required)

Keep Groq and Adzuna secrets in `backend/.env` only; use `backend/.env.example` as a template. Do not deploy the profile API publicly without authentication and authorization.

The previous Python script attempted to run a pickle LSTM artifact with placeholder preprocessing. The archive is kept for research only; the cleaned API does not claim validated LSTM inference.
