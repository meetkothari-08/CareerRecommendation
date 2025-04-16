import { GoogleGenerativeAI } from "@google/generative-ai";

// IMPORTANT: API key should be in environment variables in production
const API_KEY = "AIzaSyD73K6W4xMBseT4MwezcQKKp3cMz1JgIDQ";
const genAI = new GoogleGenerativeAI(API_KEY);

export class GeminiService {
  private model;

  constructor() {
    // Initialize with the correct model name for chat functionality
    this.model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
  }

  async sendMessage(message: string): Promise<string> {
    try {
      // Use the chat method instead of direct generation
      const result = await this.model.generateContent(message);
      const response = await result.response;
      return response.text();
    } catch (error: unknown) {
      console.error('Error sending message to Gemini:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to get response from Gemini: ${error.message}`);
      }
      throw new Error('Failed to get response from Gemini');
    }
  }

  // Helper method to list available models (for debugging)
  async listAvailableModels(): Promise<void> {
    try {
      const models = await genAI.listModels();
      console.log('Available models:', models);
    } catch (error) {
      console.error('Error listing models:', error);
    }
  }
}

export const geminiService = new GeminiService();