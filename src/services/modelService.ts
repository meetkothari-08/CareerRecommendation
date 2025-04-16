interface UserInput {
  skills: string;
  interests: string;
  experience: string;
  education: string;
  goals: string;
}

interface RecommendationResult {
  lstm: any;
  groq: string;
  lstmAnalysis: {
    matchScore: number;
    confidence: number;
    topCareerPaths: string[];
  };
  recommendations: string;
}

export async function getCombinedRecommendations(userInput: UserInput): Promise<RecommendationResult> {
  try {
    // Call Groq API for career recommendations
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are a career guidance expert. Analyze the user\'s profile and provide detailed career recommendations.'
          },
          {
            role: 'user',
            content: `Based on this profile, what careers would you recommend?\n\nSkills: ${userInput.skills}\nInterests: ${userInput.interests}\nExperience: ${userInput.experience}\nEducation: ${userInput.education}\nGoals: ${userInput.goals}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!groqResponse.ok) {
      throw new Error('Failed to get Groq recommendations');
    }

    const groqData = await groqResponse.json();
    const groqRecommendation = groqData.choices[0].message.content;

    // Mock LSTM analysis (in a real app, this would call your ML model)
    const mockLstmAnalysis = {
      matchScore: 0.85,
      confidence: 0.92,
      topCareerPaths: [
        "Data Scientist",
        "Machine Learning Engineer",
        "AI Researcher",
        "Business Intelligence Analyst",
        "Data Engineer"
      ]
    };

    return {
      lstm: mockLstmAnalysis, // This would be real LSTM output in production
      groq: groqRecommendation,
      lstmAnalysis: mockLstmAnalysis,
      recommendations: groqRecommendation
    };
  } catch (error) {
    console.error('Error in getCombinedRecommendations:', error);
    throw error;
  }
} 