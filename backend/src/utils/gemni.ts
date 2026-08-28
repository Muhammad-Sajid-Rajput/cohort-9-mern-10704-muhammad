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

const TOTAL_DEADLINE_MS = 25_000;
const ATTEMPT_TIMEOUT_MS = 10_000;

export interface GeminiResponse {
  reply: string;
}

export const sendToGemni = async (
  prompt: string,
): Promise<GeminiResponse> => {
  let lastError: unknown;
  const startTime = Date.now();

  for (const model of MODEL_FALLBACK_CHAIN) {
    const elapsed = Date.now() - startTime;
    const remainingMs = TOTAL_DEADLINE_MS - elapsed;
    if (remainingMs <= 1000) {
      logger.warn('gemini: total generation timeout budget exhausted');
      break;
    }

    const attemptTimeout = Math.min(remainingMs, ATTEMPT_TIMEOUT_MS);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), attemptTimeout);

    try {
      const isGemini3 = model.startsWith('gemini-3');
      const config = isGemini3
        ? { abortSignal: controller.signal }
        : { temperature: 0.7, abortSignal: controller.signal };

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config,
      });
      clearTimeout(timeoutId);

      if (model !== MODEL_FALLBACK_CHAIN[0]) {
        logger.info(`gemini: using fallback model "${model}"`);
      }
      return { reply: response.text ?? 'Here is the relevant information found in your notes.' };
    } catch (e: unknown) {
      clearTimeout(timeoutId);

      const status = (e as any)?.status || (e as any)?.statusCode;
      const isPermanentError = status === 400 || status === 401 || status === 403;
      if (isPermanentError) {
        logger.error(`gemini: permanent error (${status}) with model "${model}"`, {
          error: e instanceof Error ? e.message : e,
        });
        throw e;
      }

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
