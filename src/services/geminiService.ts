/**
 * Legacy Gemini integration intentionally disabled.
 * Browser-delivered API keys are not safe for paid/private AI services.
 * Current career recommendations and chat use the Flask API instead.
 */
export class GeminiService {
  async sendMessage(_message: string): Promise<string> {
    throw new Error('Legacy Gemini integration is disabled. Use the server-backed career chat instead.');
  }
}

export const geminiService = new GeminiService();
