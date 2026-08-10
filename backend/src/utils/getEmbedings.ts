import axios from 'axios';

interface VoyageEmbeddingItem {
  embedding: number[];
  index: number;
}

interface VoyageEmbeddingResponse {
  data: VoyageEmbeddingItem[];
}

const VOYAGE_URL = 'https://api.voyageai.com/v1/embeddings';
const VOYAGE_TIMEOUT_MS = 10_000;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const requestEmbeddings = async (
  input: string | string[],
  inputType: 'document' | 'query',
): Promise<number[][]> => {
  const apiKey = process.env.VOYAGEAI_KEY;
  if (!apiKey) {
    throw new Error('VOYAGEAI_KEY is not configured in environment variables');
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await axios.post<VoyageEmbeddingResponse>(
        VOYAGE_URL,
        {
          model: 'voyage-4',
          input,
          input_type: inputType,
        },
        {
          timeout: VOYAGE_TIMEOUT_MS,
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );
      return res.data.data.map((item) => item.embedding);
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 429 && attempt < 2) {
        await delay(1500 * (attempt + 1));
        continue;
      }
      throw error;
    }
  }
  throw new Error('VoyageAI embedding service rate limit exceeded');
};

export const getEmbeddings = async (texts: string[]): Promise<number[][]> => {
  return requestEmbeddings(texts, 'document');
};

export const getEmbedding = async (text: string): Promise<number[]> => {
  const embeddings = await requestEmbeddings(text, 'query');
  return embeddings[0];
};
