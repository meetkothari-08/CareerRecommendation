export interface UserInput {
  skills: string;
  interests: string;
  experience: string;
  education: string;
  goals: string;
}

export interface RecommendationResult {
  method: 'generative-ai';
  recommendations: string;
}

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export async function getCombinedRecommendations(userInput: UserInput): Promise<RecommendationResult> {
  const response = await fetch(`${API_URL}/api/recommendations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userInput),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Unable to generate career recommendations');
  return data as RecommendationResult;
}
