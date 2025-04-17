# Career Recommendation System Backend

This is the backend service for the Career Recommendation System, which combines LSTM model predictions with Groq API recommendations.

## Setup

1. Create a Python virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create a `.env` file in the backend directory with your Groq API key:
```
GROQ_API_KEY=your_groq_api_key_here
```

4. Place your LSTM model file (`lstm_model.pkl`) in the backend directory.

## Running the Server

Start the Flask server:
```bash
python app.py
```

The server will run on `http://localhost:5000`.

## API Endpoints

### POST /api/recommendations

Get career recommendations using both LSTM model and Groq API.

Request body:
```json
{
  "skills": "string",
  "interests": "string",
  "experience": "string",
  "education": "string",
  "goals": "string"
}
```

Response:
```json
{
  "lstm": {
    "matchScore": number,
    "confidence": number,
    "topCareerPaths": string[]
  },
  "groq": string,
  "lstmAnalysis": {
    "matchScore": number,
    "confidence": number,
    "topCareerPaths": string[]
  },
  "recommendations": string
}
```

## Error Handling

The API includes comprehensive error handling for:
- Missing LSTM model
- Invalid input data
- Groq API failures
- Model prediction errors

If either the LSTM model or Groq API fails, the service will still return results from the working component. 