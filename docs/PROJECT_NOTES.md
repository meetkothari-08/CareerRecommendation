# Project notes and limitations

## Problem and approach

People exploring a new career need a way to connect skills, education, interests, and goals with plausible career options and concrete learning steps. This prototype combines an AI guidance endpoint with a small structured career knowledge base, simple keyword-based course matching, and external market-data visualizations.

## How the application works

1. The React questionnaire collects five profile fields.
2. The frontend calls the Flask recommendation API.
3. Flask sends a career-focused prompt to a configured Groq model; no provider secret is shipped to the browser.
4. The response is shown as generated career advice with no invented confidence metrics.
5. The separate chat endpoint supplies ongoing advice; job-market data is fetched server-side from Adzuna.
6. Course matching uses literal keyword containment against a local CSV; it is not TF-IDF or an embedding model.

## Honest model status

An `backend/lstm_model.pkl` artifact existed in the original repository, but its preprocessing inputs, feature order, training dataset, class labels, model architecture, and performance metrics were not provided. The older Python backend used illustrative feature extraction and placeholder class mapping, and the browser-side service previously used random match scores while labeling them as LSTM output. Those are not valid model evaluation results. The cleanup therefore disables model-score claims rather than pretending that the model has been verified.

To restore a genuine predictive model, obtain training/inference code, the original preprocessing pipeline, class mapping, validation split, evaluation report, and repeatable tests. Treat any stored pickle as untrusted until its origin is verified.

## Known limitations and future work

- The career guidance is generative AI output and may be inaccurate or outdated.
- Course matching is literal keyword matching and may return unrelated or incomplete courses.
- Curated salary and career examples may not reflect live figures.
- The Express profile API is optional; its demo user ID and lack of authentication make it unsuitable for internet exposure.
- No automated end-to-end tests or deployed demo are included.
- The original frontend contains incomplete flows and legacy UI sections requiring further acceptance testing.
- Screenshots, model evaluation plots, and a deployed preview should be added only when verified, not fabricated.

## Security and publishing

Historical client code contained a Gemini key and Adzuna application credentials. Revocation/rotation must be performed through the respective providers. Removing secrets from current source is insufficient to purge them from Git history. GitHub history should be reviewed before switching repository visibility to public.

The optional profile endpoints accept user IDs without authentication. Keep the profile API local until authorization is implemented.
