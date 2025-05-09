import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

interface GeminiResponse {
  usage?: {
    totalTokens?: number;
    inputTokens?: number;
    outputTokens?: number;
  };
}

function calculateCost(tokens: number): number {
  // Gemini pricing as of 2024
  const costPerInputToken = 0.00025 / 1000; // $0.00025 per 1K tokens for input
  const costPerOutputToken = 0.0005 / 1000;  // $0.0005 per 1K tokens for output
  return tokens * (costPerInputToken + costPerOutputToken);
}

// Create the base AI instance
const baseAi = genkit({
  promptDir: './prompts',
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY,
    }),
  ],
  model: 'googleai/gemini-2.0-flash',
});

// Wrap the AI instance with usage tracking
export const ai = {
  ...baseAi,
  definePrompt: baseAi.definePrompt.bind(baseAi),
  defineFlow: baseAi.defineFlow.bind(baseAi),
  async generate(prompt: string) {
    try {
      const response = await baseAi.generate(prompt);
      const totalTokens = (response as GeminiResponse).usage?.totalTokens || 0;
      
      if (typeof window !== 'undefined') {
        const ApiUsageService = (await import('../services/api-usage')).ApiUsageService;
        await ApiUsageService.getInstance().trackRequest(
          'gemini',
          totalTokens,
          calculateCost(totalTokens)
        );
      }
      
      return response;
    } catch (error) {
      if (typeof window !== 'undefined') {
        const ApiUsageService = (await import('../services/api-usage')).ApiUsageService;
        await ApiUsageService.getInstance().trackError();
      }
      throw error;
    }
  }
};
