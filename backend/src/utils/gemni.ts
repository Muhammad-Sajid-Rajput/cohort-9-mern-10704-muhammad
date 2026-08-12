import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import { logger } from './logger';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not configured in environment variables');
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const MODEL_FALLBACK_CHAIN = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
];

export const sendToGemni = async (prompt: string) => {
  let lastError: unknown;

  for (const model of MODEL_FALLBACK_CHAIN) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15_000);

    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          temperature: 0.8,
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
      const err = e as { status?: number; error?: { code?: number }; message?: string };
      const status = err?.status ?? err?.error?.code;

      if (status === 404 || status === 429) {
        logger.warn(`gemini: model "${model}" unavailable (${status}), trying next`);
        lastError = e;
        continue;
      }
      logger.error('gemini: unexpected error during content generation', {
        model,
        status,
        error: e instanceof Error ? e.message : 'unknown error',
      });
      throw e;
    }
  }

  logger.warn('gemini: all models in fallback chain exhausted', {
    error: lastError instanceof Error ? lastError.message : 'unknown error',
  });
  return { reply: 'The AI assistant is currently unavailable. Please try again shortly.' };
};
