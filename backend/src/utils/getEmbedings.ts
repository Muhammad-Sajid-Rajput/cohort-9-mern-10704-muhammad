import axios from 'axios';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const getEmbeddings = async (texts: string[]): Promise<number[][]> => {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await axios.post(
        'https://api.voyageai.com/v1/embeddings',
        {
          model: 'voyage-4',
          input: texts,
          input_type: 'document',
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.VOYAGEAI_KEY}`,
            'Content-Type': 'application/json',
          },
        },
      );
      return res.data.data.map((item: any) => item.embedding);
    } catch (error: any) {
      if (error.response?.status === 429 && attempt < 2) {
        await delay(1500 * (attempt + 1));
        continue;
      }
      throw error;
    }
  }
  throw new Error('VoyageAI rate limit exceeded');
};

export const getEmbedding = async (text: string): Promise<number[]> => {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await axios.post(
        'https://api.voyageai.com/v1/embeddings',
        {
          model: 'voyage-4',
          input: text,
          input_type: 'query',
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.VOYAGEAI_KEY}`,
            'Content-Type': 'application/json',
          },
        },
      );
      return res.data.data[0].embedding;
    } catch (error: any) {
      if (error.response?.status === 429 && attempt < 2) {
        await delay(1500 * (attempt + 1));
        continue;
      }
      throw error;
    }
  }
  throw new Error('VoyageAI rate limit exceeded');
};
