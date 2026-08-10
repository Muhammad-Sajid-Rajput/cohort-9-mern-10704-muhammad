import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import { logger } from './logger';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const MODEL_FALLBACK_CHAIN = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
];

export const sendToGemni = async (context: string) => {
  let lastError: unknown;

  for (const model of MODEL_FALLBACK_CHAIN) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: context,
        config: { temperature: 0.8 },
      });
      if (model !== MODEL_FALLBACK_CHAIN[0]) {
        logger.info(`gemini: using fallback model "${model}"`);
      }
      return { reply: response.text ?? 'Here is the relevant information found in your notes.' };
    } catch (e: any) {
      const status = e?.status ?? e?.error?.code;
      if (status === 404 || status === 429) {
        logger.warn(`gemini: model "${model}" unavailable (${status}), trying next`);
        lastError = e;
        continue;
      }
      logger.error('gemini: unexpected error', { error: e });
      throw e;
    }
  }

  logger.warn('gemini: all models in fallback chain exhausted (likely rate limit), returning fallback response', { error: lastError });
  return { reply: 'Based on your notes, here is the relevant context: ' + context.substring(0, 300) };
};
