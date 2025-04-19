import { Groq } from 'groq-sdk';
import {
  EngineeringField,
  EngineeringSubField,
  CareerRole,
  Skill,
  Certification,
  CareerQuestion,
  LearningResource
} from '../types/knowledgeBase';
import { engineeringFields } from '../data/engineeringFields';
import { commonQuestions } from '../data/commonQuestions';

export class KnowledgeBaseService {
  private groq: Groq;
  private engineeringFields: EngineeringField[];
  private commonQuestions: CareerQuestion[];

  constructor() {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('VITE_GROQ_API_KEY is not set in environment variables');
    }
    this.groq = new Groq({
      apiKey,
      dangerouslyAllowBrowser: true
    });
    this.engineeringFields = engineeringFields;
    this.commonQuestions = commonQuestions;
  }

  public async getCareerRecommendations(userProfile: {
    skills: string[];
    interests: string[];
    education: string;
    experience: string;
    goals: string;
  }): Promise<{
    recommendedFields: EngineeringField[];
    recommendedRoles: CareerRole[];
    skillGaps: Skill[];
    learningPath: LearningResource[];
  }> {
    try {
      // First, try to match with our knowledge base
      const recommendations = this.getRecommendationsFromKnowledgeBase(userProfile);
      
      if (recommendations.recommendedFields.length > 0) {
        return recommendations;
      }

      // If no good matches found, fall back to Groq API
      return this.getRecommendationsFromGroq(userProfile);
    } catch (error) {
      console.error('Error getting career recommendations:', error);
      throw error;
    }
  }

  private getRecommendationsFromKnowledgeBase(userProfile: {
    skills: string[];
    interests: string[];
    education: string;
    experience: string;
    goals: string;
  }) {
    const recommendedFields: EngineeringField[] = [];
    const recommendedRoles: CareerRole[] = [];
    const skillGaps: Skill[] = [];
    const learningPath: LearningResource[] = [];

    // Match engineering fields based on skills and interests
    for (const field of this.engineeringFields) {
      let skillMatch = 0;
      let interestMatch = 0;

      for (const subField of field.subFields) {
        // Check skills match
        for (const skill of subField.keySkills) {
          if (userProfile.skills.some(s => 
            s.toLowerCase().includes(skill.name.toLowerCase())
          )) {
            skillMatch++;
          }
        }

        // Check interests match
        if (userProfile.interests.some(i => 
          subField.description.toLowerCase().includes(i.toLowerCase())
        )) {
          interestMatch++;
        }

        // Add relevant roles based on experience
        const experienceYears = parseInt(userProfile.experience) || 0;
        const relevantRoles = subField.roles.filter(role => {
          if (role.experienceLevel === 'Entry' && experienceYears < 3) return true;
          if (role.experienceLevel === 'Mid' && experienceYears >= 3 && experienceYears < 7) return true;
          if (role.experienceLevel === 'Senior' && experienceYears >= 7) return true;
          return false;
        });
        recommendedRoles.push(...relevantRoles);

        // Identify skill gaps
        for (const skill of subField.keySkills) {
          if (skill.importance === 'Essential' && 
              !userProfile.skills.some(s => s.toLowerCase().includes(skill.name.toLowerCase()))) {
            skillGaps.push(skill);
          }
        }
      }

      // If good match found, add to recommendations
      if (skillMatch > 3 || interestMatch > 1) {
        recommendedFields.push(field);
      }
    }

    // Create learning path based on skill gaps
    for (const gap of skillGaps) {
      learningPath.push(...gap.learningResources);
    }

    return {
      recommendedFields,
      recommendedRoles,
      skillGaps,
      learningPath
    };
  }

  private async getRecommendationsFromGroq(userProfile: {
    skills: string[];
    interests: string[];
    education: string;
    experience: string;
    goals: string;
  }) {
    const prompt = `Based on the following user profile, provide detailed engineering career recommendations:
      Skills: ${userProfile.skills.join(', ')}
      Interests: ${userProfile.interests.join(', ')}
      Education: ${userProfile.education}
      Experience: ${userProfile.experience}
      Goals: ${userProfile.goals}

      Please provide:
      1. Recommended engineering fields and subfields
      2. Specific roles that match their profile
      3. Key skills they should develop
      4. Learning resources and certifications to pursue`;

    const completion = await this.groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 0.95,
    });

    const response = completion.choices[0]?.message?.content || '';
    
    // Parse Groq response and convert to our format
    return this.parseGroqResponse(response);
  }

  private parseGroqResponse(response: string) {
    // Default empty response structure
    const result = {
      recommendedFields: [] as EngineeringField[],
      recommendedRoles: [] as CareerRole[],
      skillGaps: [] as Skill[],
      learningPath: [] as LearningResource[]
    };

    try {
      // Extract fields and roles from response
      const fields = response.match(/(?:field|subfield):\s*([\w\s]+)/gi) || [];
      const roles = response.match(/role:\s*([\w\s]+)/gi) || [];
      const skills = response.match(/skill:\s*([\w\s]+)/gi) || [];
      
      // Map to existing fields and roles from our knowledge base
      for (const fieldMatch of fields) {
        const fieldName = fieldMatch.split(':')[1].trim();
        const matchingField = this.engineeringFields.find(f => 
          f.name.toLowerCase().includes(fieldName.toLowerCase())
        );
        if (matchingField) {
          result.recommendedFields.push(matchingField);
        }
      }

      // Add any mentioned skills as skill gaps
      for (const skillMatch of skills) {
        const skillName = skillMatch.split(':')[1].trim();
        result.skillGaps.push({
          name: skillName,
          category: 'Technical',
          description: `Skill identified by AI as important: ${skillName}`,
          importance: 'Essential',
          learningResources: []
        });
      }
    } catch (error) {
      console.error('Error parsing Groq response:', error);
    }

    return result;
  }

  public async getAnswerToQuestion(question: string): Promise<{
    answer: string;
    source: 'knowledge_base' | 'groq';
    relatedQuestions?: string[];
  }> {
    // First, try to find an answer in our knowledge base
    const knowledgeBaseAnswer = this.findAnswerInKnowledgeBase(question);
    if (knowledgeBaseAnswer) {
      return {
        answer: knowledgeBaseAnswer.answer,
        source: 'knowledge_base',
        relatedQuestions: knowledgeBaseAnswer.relatedQuestions
      };
    }

    // If no answer found, use Groq API
    const groqAnswer = await this.getGroqAnswer(question);
    return {
      answer: groqAnswer,
      source: 'groq'
    };
  }

  private findAnswerInKnowledgeBase(question: string): CareerQuestion | null {
    // Convert question to lowercase for better matching
    const normalizedQuestion = question.toLowerCase();
    
    // Try to find exact match first
    let match = this.commonQuestions.find(q => 
      q.question.toLowerCase() === normalizedQuestion
    );

    // If no exact match, try keyword matching
    if (!match) {
      match = this.commonQuestions.find(q =>
        q.keywords.some(keyword =>
          normalizedQuestion.includes(keyword.toLowerCase())
        )
      );
    }

    return match || null;
  }

  private async getGroqAnswer(question: string): Promise<string> {
    const completion = await this.groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a career guidance expert specializing in engineering careers. Provide detailed, accurate, and helpful responses to career-related questions.'
        },
        {
          role: 'user',
          content: question
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 0.95,
    });

    return completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';
  }
} 