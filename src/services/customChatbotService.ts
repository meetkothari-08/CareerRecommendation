import { Groq } from 'groq-sdk';
import { KnowledgeBaseService } from './knowledgeBaseService';

interface UserProfile {
  education: string;
  skills: string[];
  interests: string[];
  experience: string;
  goals: string;
}

interface ProfileQuestion {
  question: string;
  field: keyof UserProfile;
  suggestions?: string[];
}

export class CustomChatbotService {
  private groq: Groq;
  private knowledgeBase: KnowledgeBaseService;
  private conversationHistory: { role: 'user' | 'assistant'; content: string; }[] = [];
  private userProfile: UserProfile = {
    education: '',
    skills: [],
    interests: [],
    experience: '',
    goals: ''
  };

  // Keywords to identify career-related queries
  private readonly careerKeywords = [
    'career', 'job', 'work', 'profession', 'salary', 'skills', 'education',
    'degree', 'experience', 'interview', 'resume', 'cv', 'certification',
    'training', 'developer', 'engineer', 'software', 'programming', 'coding',
    'tech', 'technology', 'ai', 'data', 'cloud', 'devops', 'security',
    'web', 'mobile', 'frontend', 'backend', 'fullstack', 'database',
    'machine learning', 'artificial intelligence', 'cybersecurity',
    'network', 'system', 'architecture', 'design', 'development',
    'industry', 'company', 'startup', 'enterprise', 'position',
    'role', 'responsibility', 'promotion', 'growth', 'path'
  ];

  private currentQuestionIndex: number = 0;

  private readonly profileQuestions: ProfileQuestion[] = [
    {
      question: "What is your highest level of education?",
      field: "education",
      suggestions: ["High School", "Bachelor's in Engineering", "Bachelor's in Computer Science", "Master's", "PhD", "Other"]
    },
    {
      question: "What technical skills and technologies do you know? (separate multiple skills with commas)",
      field: "skills",
      suggestions: ["Python", "JavaScript", "Java", "Cloud Computing", "Machine Learning", "Data Analysis", "Web Development"]
    },
    {
      question: "What areas of technology or engineering interest you most? (separate with commas)",
      field: "interests",
      suggestions: ["Software Development", "Data Science", "AI/ML", "Cloud Computing", "Cybersecurity", "DevOps", "Mobile Development"]
    },
    {
      question: "How many years of relevant experience do you have?",
      field: "experience",
      suggestions: ["No experience", "0-2 years", "2-5 years", "5-10 years", "10+ years"]
    },
    {
      question: "What are your career goals and aspirations?",
      field: "goals",
      suggestions: [
        "Become a Senior Developer",
        "Lead Technical Teams",
        "Specialize in AI/ML",
        "Start a Tech Company",
        "Transition to Management"
      ]
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
    this.knowledgeBase = new KnowledgeBaseService();
  }

  private isCareerRelatedQuery(query: string): boolean {
    const normalizedQuery = query.toLowerCase();
    return this.careerKeywords.some(keyword => normalizedQuery.includes(keyword.toLowerCase()));
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
      // If we're in the profile questionnaire, continue with it
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

      // Check if the query is career-related
      if (!this.isCareerRelatedQuery(userInput)) {
        return "I am a career guidance expert focused on technology and engineering careers. Please ask me questions related to career development, job opportunities, skills, education, or professional growth in the tech industry.";
      }

      // Process both knowledge base and Groq responses for career-related queries
      const [knowledgeBaseAnswer, groqAnswer] = await Promise.all([
        this.knowledgeBase.getAnswerToQuestion(userInput),
        this.getGroqResponse(userInput)
      ]);

      // Combine responses from both sources
      let response = '';
      
      if (knowledgeBaseAnswer.source === 'knowledge_base') {
        response += "Based on our career database:\n\n";
        response += knowledgeBaseAnswer.answer;
        if (knowledgeBaseAnswer.relatedQuestions?.length) {
          response += '\n\nRelated questions you might be interested in:\n';
          knowledgeBaseAnswer.relatedQuestions.forEach((q, i) => {
            response += `${i + 1}. ${q}\n`;
          });
        }
        response += '\n\n';
      }

      response += "Additional insights from AI:\n\n";
      response += groqAnswer;

      return response;

    } catch (error) {
      console.error('Error handling user input:', error);
      return 'I apologize, but I encountered an error. Please try again.';
    }
  }

  private async getGroqResponse(userInput: string): Promise<string> {
    try {
      this.conversationHistory.push({ role: 'user', content: userInput });

      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a career guidance expert specializing in technology and engineering careers. ONLY provide advice related to careers, jobs, skills, education, and professional development in the tech industry. If a question is not related to careers or professional development, politely explain that you can only help with career-related questions.'
          },
          ...this.conversationHistory
        ],
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
    const { field } = currentQuestion;

    if (Array.isArray(this.userProfile[field])) {
      (this.userProfile[field] as string[]).push(...userInput.split(',').map(item => item.trim()));
    } else {
      (this.userProfile[field] as string) = userInput;
    }
  }

  private async generateCareerRecommendations(): Promise<string> {
    try {
      // Get recommendations from both knowledge base and Groq
      const [kbRecommendations, groqRecommendations] = await Promise.all([
        this.knowledgeBase.getCareerRecommendations({
          skills: this.userProfile.skills,
          interests: this.userProfile.interests,
          education: this.userProfile.education,
          experience: this.userProfile.experience,
          goals: this.userProfile.goals
        }),
        this.getGroqCareerRecommendations()
      ]);

      let response = 'Based on your profile, here are comprehensive career recommendations:\n\n';

      // Add knowledge base recommendations
      if (kbRecommendations.recommendedFields.length > 0) {
        response += '🎯 Recommended Engineering Fields:\n';
        kbRecommendations.recommendedFields.forEach(field => {
          response += `\n${field.name}\n`;
          response += `${field.description}\n`;
          response += `• Salary Range: ${field.averageSalaryRange.entry} (Entry) to ${field.averageSalaryRange.senior} (Senior)\n`;
          response += `• Job Outlook: ${field.jobOutlook}\n`;
        });
      }

      if (kbRecommendations.recommendedRoles.length > 0) {
        response += '\n👨‍💻 Specific Roles You Might Like:\n';
        kbRecommendations.recommendedRoles.forEach(role => {
          response += `\n${role.title}\n`;
          response += `${role.description}\n`;
          response += `• Required Skills: ${role.requiredSkills.join(', ')}\n`;
          response += `• Salary Range: $${role.salaryRange.min.toLocaleString()} - $${role.salaryRange.max.toLocaleString()}\n`;
        });
      }

      if (kbRecommendations.skillGaps.length > 0) {
        response += '\n📚 Skills to Develop:\n';
        kbRecommendations.skillGaps.forEach(skill => {
          response += `\n${skill.name}\n`;
          response += `${skill.description}\n`;
          if (skill.learningResources.length > 0) {
            response += 'Recommended Resources:\n';
            skill.learningResources.forEach(resource => {
              response += `• ${resource.title} (${resource.provider}) - ${resource.cost}\n`;
            });
          }
        });
      }

      // Add AI-powered insights
      response += '\n🤖 AI-Powered Career Insights:\n';
      response += groqRecommendations;

      return response;
    } catch (error) {
      console.error('Error generating career recommendations:', error);
      return 'I apologize, but I encountered an error generating recommendations. Please try again.';
    }
  }

  private async getGroqCareerRecommendations(): Promise<string> {
    const prompt = `As a career guidance expert, provide detailed career recommendations based on this profile:

Education: ${this.userProfile.education}
Skills: ${this.userProfile.skills.join(', ')}
Interests: ${this.userProfile.interests.join(', ')}
Experience: ${this.userProfile.experience}
Career Goals: ${this.userProfile.goals}

Please provide:
1. Career paths that best match their profile
2. Emerging opportunities in their areas of interest
3. Specific next steps for career growth
4. Industry trends and future outlook
5. Potential challenges and how to overcome them`;

    const completion = await this.groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a career guidance expert specializing in technology and engineering careers. Focus on providing actionable, forward-looking advice that considers current industry trends and future opportunities.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 0.95,
    });

    return completion.choices[0]?.message?.content || 'Unable to generate AI recommendations.';
  }
}

// Create and export an instance
export const customChatbotService = new CustomChatbotService();