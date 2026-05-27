import OpenAI from "openai";

const EMBEDDING_MODEL = "text-embedding-3-small";
const embeddingCache = new Map<string, Promise<number[]>>();

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required for hybrid search embeddings.");
  }

  return new OpenAI({ apiKey });
}

function normalizeVector(vector: number[]) {
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));

  if (!magnitude) {
    return vector;
  }

  return vector.map((value) => value / magnitude);
}

async function createEmbedding(text: string) {
  const client = getOpenAIClient();
  const response = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text
  });

  const embedding = response.data[0]?.embedding;

  if (!embedding) {
    throw new Error("Embedding response did not include a vector.");
  }

  return normalizeVector(embedding);
}

export async function embedText(text: string) {
  const normalizedText = text.trim();

  if (!normalizedText) {
    throw new Error("Cannot generate an embedding for empty text.");
  }

  const cacheKey = normalizedText.toLowerCase();

  if (!embeddingCache.has(cacheKey)) {
    embeddingCache.set(cacheKey, createEmbedding(normalizedText));
  }

  return embeddingCache.get(cacheKey)!;
}

export function cosineSimilarity(left: number[], right: number[]) {
  const dimensions = Math.min(left.length, right.length);

  if (!dimensions) {
    return 0;
  }

  let dotProduct = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (let index = 0; index < dimensions; index += 1) {
    dotProduct += left[index] * right[index];
    leftMagnitude += left[index] * left[index];
    rightMagnitude += right[index] * right[index];
  }

  if (!leftMagnitude || !rightMagnitude) {
    return 0;
  }

  return dotProduct / Math.sqrt(leftMagnitude * rightMagnitude);
}
