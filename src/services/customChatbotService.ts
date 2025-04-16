import { Groq } from 'groq-sdk';

interface UserProfile {
  education: string;
  skills: string[];
  interests: string[];
  workPreferences: {
    location: string;
    schedule: string;
    environment: string;
  };
  experience: string;
  goals: string;
}

interface ProfileQuestion {
  question: string;
  field: keyof UserProfile;
  subField?: string;
  suggestions?: string[];
}

export class CustomChatbotService {
  private groq: Groq;
  private conversationHistory: { role: 'user' | 'assistant'; content: string; }[] = [];
  private userProfile: UserProfile = {
    education: '',
    skills: [],
    interests: [],
    workPreferences: {
      location: '',
      schedule: '',
      environment: ''
    },
    experience: '',
    goals: ''
  };

  private currentQuestionIndex: number = 0;

  private readonly profileQuestions: ProfileQuestion[] = [
    {
      question: "What is your highest level of education?",
      field: "education",
      suggestions: ["High School", "Bachelor's", "Master's", "PhD", "Other"]
    },
    {
      question: "What skills do you have? (separate multiple skills with commas)",
      field: "skills"
    },
    {
      question: "What are your interests or hobbies? (separate multiple interests with commas)",
      field: "interests"
    },
    {
      question: "What is your preferred work location? (e.g., remote, office, hybrid)",
      field: "workPreferences",
      subField: "location"
    },
    {
      question: "What is your preferred work schedule? (e.g., full-time, part-time, flexible)",
      field: "workPreferences",
      subField: "schedule"
    },
    {
      question: "What type of work environment do you prefer?",
      field: "workPreferences",
      subField: "environment",
      suggestions: ["Startup", "Corporate", "Non-profit", "Government", "Other"]
    },
    {
      question: "How many years of work experience do you have?",
      field: "experience"
    },
    {
      question: "What are your career goals?",
      field: "goals"
    }
  ];

  constructor() {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('VITE_GROQ_API_KEY is not set in environment variables');
    }
    this.groq = new Groq({ 
      apiKey,
      dangerouslyAllowBrowser: true 
    });
  }

  public getCurrentQuestion(): { question: string; suggestions?: string[] } | null {
    if (this.currentQuestionIndex >= this.profileQuestions.length) {
      return null;
    }
    const currentQuestion = this.profileQuestions[this.currentQuestionIndex];
    return {
      question: currentQuestion.question,
      suggestions: currentQuestion.suggestions
    };
  }

  public async handleUserInput(userInput: string): Promise<string> {
    try {
      const currentQuestion = this.getCurrentQuestion();
      if (currentQuestion) {
        await this.updateUserProfile(userInput);
        this.currentQuestionIndex++;
        const nextQuestion = this.getCurrentQuestion();
        if (nextQuestion) {
          return nextQuestion.question;
        } else {
          const recommendations = await this.generateCareerRecommendations();
          return recommendations;
        }
      }

      return await this.getGroqResponse(userInput);
    } catch (error) {
      console.error('Error handling user input:', error);
      return 'I apologize, but I encountered an error. Please try again.';
    }
  }

  private async getGroqResponse(userInput: string): Promise<string> {
    try {
      this.conversationHistory.push({ role: 'user', content: userInput });

      const completion = await this.groq.chat.completions.create({
        messages: this.conversationHistory,
        model: "llama-3.3-70b-versatile",
        temperature: 0.7,
        max_tokens: 1024,
        top_p: 0.95,
      });

      const response = completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';
      this.conversationHistory.push({ role: 'assistant', content: response });
      
      return response;
    } catch (error) {
      console.error('Error getting Groq response:', error);
      return 'I apologize, but I encountered an error. Please try again.';
    }
  }

  private async updateUserProfile(userInput: string): Promise<void> {
    if (this.currentQuestionIndex >= this.profileQuestions.length) return;
    
    const currentQuestion = this.profileQuestions[this.currentQuestionIndex];
    const { field, subField } = currentQuestion;

    if (subField && typeof this.userProfile[field] === 'object') {
      const fieldObj = this.userProfile[field] as Record<string, string>;
      fieldObj[subField] = userInput;
    } else if (Array.isArray(this.userProfile[field])) {
      (this.userProfile[field] as string[]).push(...userInput.split(',').map(item => item.trim()));
    } else {
      (this.userProfile[field] as string) = userInput;
    }
  }

  private async generateCareerRecommendations(): Promise<string> {
    const prompt = `Based on the following user profile, provide personalized career recommendations:
      Education: ${this.userProfile.education}
      Skills: ${this.userProfile.skills.join(', ')}
      Interests: ${this.userProfile.interests.join(', ')}
      Work Preferences:
      - Location: ${this.userProfile.workPreferences.location}
      - Schedule: ${this.userProfile.workPreferences.schedule}
      - Environment: ${this.userProfile.workPreferences.environment}
      Experience: ${this.userProfile.experience}
      Goals: ${this.userProfile.goals}

      Please provide:
      1. 3-5 recommended career paths
      2. Key skills to develop for each path
      3. Specific next steps to get started
      4. Potential challenges and how to overcome them`;

    return this.getGroqResponse(prompt);
  }
}

// Create and export an instance
export const customChatbotService = new CustomChatbotService();