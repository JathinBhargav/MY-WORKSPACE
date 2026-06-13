import { GoogleGenAI } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY is not defined. Please add it to your secrets.');
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

/**
 * Wraps ai.models.generateContent with exponential backoff retry logic.
 * Handles transient errors like 503 (UNAVAILABLE/High Demand) or 429 (RESOURCE_EXHAUSTED).
 */
export async function generateContentWithRetry(params: {
  model: string;
  contents: string;
  config?: any;
}, retries = 3, delayMs = 1000): Promise<any> {
  const ai = getGeminiClient();
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      const response = await ai.models.generateContent(params);
      return response;
    } catch (error: any) {
      lastError = error;
      const errorMsg = error?.message || '';
      const errorCode = error?.status || error?.statusCode || error?.code || 0;
      
      const is503 = errorCode === 503 || errorMsg.includes('503') || errorMsg.toUpperCase().includes('UNAVAILABLE') || errorMsg.includes('high demand');
      const isRateLimit = errorCode === 429 || errorMsg.includes('429') || errorMsg.toUpperCase().includes('RESOURCE_EXHAUSTED');
      
      if (is503 || isRateLimit) {
        console.warn(`[Gemini API] Request failed with transient error ${errorCode} (attempt ${i + 1}/${retries}). Retrying in ${delayMs}ms... Error: ${errorMsg}`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        delayMs *= 2; // Exponential backoff
      } else {
        // Non-transient errors, throw immediately
        throw error;
      }
    }
  }
  throw lastError;
}
