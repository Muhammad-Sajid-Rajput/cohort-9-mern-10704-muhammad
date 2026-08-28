import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import { logger } from './logger';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not configured in environment variables');
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const MODEL_FALLBACK_CHAIN = [
  'gemini-3.5-flash',
  'gemini-3.6-flash',
  'gemini-2.5-flash',
];

export const sendToGemni = async (prompt: string) => {
  let lastError: unknown;

  for (const model of MODEL_FALLBACK_CHAIN) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25_000);

    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          temperature: 0.7,
          abortSignal: controller.signal,
        },
      });
      clearTimeout(timeoutId);

      if (model !== MODEL_FALLBACK_CHAIN[0]) {
        logger.info(`gemini: using fallback model "${model}"`);
      }
      return { reply: response.text ?? 'Here is the relevant information found in your notes.' };
    } catch (e: unknown) {
      clearTimeout(timeoutId);
      logger.warn(`gemini: model "${model}" failed, trying next in fallback chain`, {
        error: e instanceof Error ? e.message : e,
      });
      lastError = e;
      continue;
    }
  }

  logger.warn('gemini: all models in fallback chain exhausted', {
    error: lastError instanceof Error ? lastError.message : 'unknown error',
  });
  return { reply: 'The AI assistant is currently unavailable. Please try again shortly.' };
};
