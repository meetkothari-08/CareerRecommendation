from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
import pickle
import numpy as np
from dotenv import load_dotenv
import os
import requests

app = Flask(__name__)
CORS(app)
load_dotenv()

# Load the LSTM model
try:
    with open('lstm_model.pkl', 'rb') as f:
        model = pickle.load(f)
    model.eval()  # Set the model to evaluation mode
except Exception as e:
    print(f"Error loading model: {e}")
    model = None

# Groq API configuration
GROQ_API_KEY = os.getenv('GROQ_API_KEY')
GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

def preprocess_input(user_input):
    """
    Preprocess user input for LSTM model.
    Convert text data into numerical features.
    """
    # Add your preprocessing logic here
    # This should match how your LSTM model was trained
    try:
        # Example preprocessing (modify according to your model's requirements)
        features = {
            'skills': len(user_input['skills'].split(',')),
            'interests': len(user_input['interests'].split(',')),
            'experience': float(user_input['experience'].split()[0]),  # Assuming format "X years"
            'education_level': map_education_level(user_input['education']),
            'goals_clarity': analyze_goals_clarity(user_input['goals'])
        }
        return torch.tensor([list(features.values())], dtype=torch.float32)
    except Exception as e:
        print(f"Error in preprocessing: {e}")
        return None

def map_education_level(education):
    """Map education level to numerical value"""
    education_map = {
        'high school': 1,
        'bachelor': 2,
        'master': 3,
        'phd': 4
    }
    education = education.lower()
    for key in education_map:
        if key in education:
            return education_map[key]
    return 1  # Default to high school if no match

def analyze_goals_clarity(goals):
    """Analyze the clarity of goals statement"""
    words = goals.split()
    return min(len(words) / 20, 1)  # Normalize to 0-1 range

def get_groq_recommendations(user_input):
    """Get career recommendations from Groq API"""
    try:
        headers = {
            'Authorization': f'Bearer {GROQ_API_KEY}',
            'Content-Type': 'application/json'
        }
        
        prompt = f"""Based on this profile, provide detailed career recommendations:
        Skills: {user_input['skills']}
        Interests: {user_input['interests']}
        Experience: {user_input['experience']}
        Education: {user_input['education']}
        Goals: {user_input['goals']}

        Please provide:
        1. 3-5 recommended career paths
        2. Key skills to develop for each path
        3. Specific next steps to get started
        4. Potential challenges and how to overcome them"""

        data = {
            'model': 'llama-3.3-70b-versatile',
            'messages': [
                {'role': 'system', 'content': 'You are a career guidance expert. Analyze the user\'s profile and provide detailed career recommendations.'},
                {'role': 'user', 'content': prompt}
            ],
            'temperature': 0.7,
            'max_tokens': 1000
        }

        response = requests.post(GROQ_API_URL, headers=headers, json=data)
        response.raise_for_status()
        return response.json()['choices'][0]['message']['content']
    except Exception as e:
        print(f"Error calling Groq API: {e}")
        return None

@app.route('/api/recommendations', methods=['POST'])
def get_recommendations():
    try:
        user_input = request.json

        # Get LSTM predictions
        lstm_result = None
        if model is not None:
            processed_input = preprocess_input(user_input)
            if processed_input is not None:
                with torch.no_grad():
                    lstm_output = model(processed_input)
                    # Convert LSTM output to career paths and confidence scores
                    # Modify this according to your model's output format
                    lstm_result = {
                        'matchScore': float(torch.max(lstm_output).item()),
                        'confidence': float(torch.softmax(lstm_output, dim=1).max().item()),
                        'topCareerPaths': decode_lstm_output(lstm_output)
                    }

        # Get Groq recommendations
        groq_recommendations = get_groq_recommendations(user_input)

        if lstm_result is None and groq_recommendations is None:
            return jsonify({
                'error': 'Both LSTM and Groq predictions failed'
            }), 500

        return jsonify({
            'lstm': lstm_result,
            'groq': groq_recommendations,
            'lstmAnalysis': lstm_result,
            'recommendations': groq_recommendations
        })

    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500

def decode_lstm_output(output):
    """
    Convert LSTM output tensor to career paths.
    Modify this according to your model's output format and career path mapping.
    """
    # Example career paths (replace with your model's actual output classes)
    career_paths = [
        "Data Scientist",
        "Software Engineer",
        "Machine Learning Engineer",
        "Business Analyst",
        "Product Manager",
        "Data Engineer",
        "AI Researcher",
        "DevOps Engineer",
        "Cloud Architect",
        "Full Stack Developer"
    ]
    
    # Get top 5 predictions
    top_indices = torch.topk(output[0], k=5).indices
    return [career_paths[i] for i in top_indices]

if __name__ == '__main__':
    app.run(debug=True, port=5000) 