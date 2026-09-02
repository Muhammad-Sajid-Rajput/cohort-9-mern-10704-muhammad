import 'dotenv/config';
import { GoogleGenAI, ApiError, type GenerateContentConfig } from '@google/genai';
import { logger } from './logger';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not configured in environment variables');
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export type GeminiModel = 'gemini-3.5-flash' | 'gemini-3.6-flash' | 'gemini-2.5-flash';

const MODEL_FALLBACK_CHAIN: readonly GeminiModel[] = [
  'gemini-3.5-flash',
  'gemini-3.6-flash',
  'gemini-2.5-flash',
] as const;

const TOTAL_DEADLINE_MS = 25_000;
const ATTEMPT_TIMEOUT_MS = 10_000;

export interface GeminiResponse {
  reply: string;
}

const getErrorStatus = (error: unknown): number | undefined => {
  if (error instanceof ApiError) {
    return error.status;
  }
  if (error && typeof error === 'object') {
    if ('status' in error && typeof error.status === 'number') return error.status;
    if ('statusCode' in error && typeof error.statusCode === 'number') return error.statusCode;
  }
  return undefined;
};

type AttemptResult =
  | { success: true; reply: string }
  | { success: false; permanent: boolean; aborted: boolean; error: unknown };

const executeModelAttempt = async (
  model: GeminiModel,
  prompt: string,
  attemptTimeout: number,
): Promise<AttemptResult> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), attemptTimeout);

  try {
    const isGemini3 = model.startsWith('gemini-3');
    const config: GenerateContentConfig = isGemini3
      ? { abortSignal: controller.signal }
      : { temperature: 0.7, abortSignal: controller.signal };

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config,
    });
    clearTimeout(timeoutId);

    return {
      success: true,
      reply: response.text ?? 'Here is the relevant information found in your notes.',
    };
  } catch (e: unknown) {
    clearTimeout(timeoutId);
    const aborted = controller.signal.aborted;
    const status = getErrorStatus(e);
    const permanent = status === 400 || status === 401 || status === 403;
    return { success: false, permanent, aborted, error: e };
  }
};

export const sendToGemni = async (prompt: string): Promise<GeminiResponse> => {
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
    const result = await executeModelAttempt(model, prompt, attemptTimeout);

    if (result.success) {
      if (model !== MODEL_FALLBACK_CHAIN[0]) {
        logger.info(`gemini: using fallback model "${model}"`);
      }
      return { reply: result.reply };
    }

    lastError = result.error;

    if (result.aborted) {
      logger.warn(`gemini: model "${model}" timed out (aborted), terminating fallback chain`);
      break;
    }

    if (result.permanent) {
      logger.error(`gemini: permanent error with model "${model}"`, {
        error: result.error instanceof Error ? result.error.message : result.error,
      });
      throw result.error;
    }

    logger.warn(`gemini: model "${model}" failed, trying next in fallback chain`, {
      error: result.error instanceof Error ? result.error.message : result.error,
    });
  }

  logger.warn('gemini: all models in fallback chain exhausted', {
    error: lastError instanceof Error ? lastError.message : 'unknown error',
  });
  return { reply: 'The AI assistant is currently unavailable. Please try again shortly.' };
};
