const VOYAGE_API_URL = "https://api.voyageai.com/v1/embeddings";
const VOYAGE_MODEL = "voyage-3";

/**
 * Embeds a user query using Voyage AI.
 * Note: input_type is "query" here — different from "document" used during ingestion.
 * This distinction improves retrieval accuracy (Voyage is optimized for asymmetric search).
 */
export async function embedQuery(query: string): Promise<number[]> {
  const response = await fetch(VOYAGE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
    },
    body: JSON.stringify({
      model: VOYAGE_MODEL,
      input: [query],
      input_type: "query",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Voyage AI embedding error: ${response.status} — ${error}`);
  }

  const data = await response.json();
  const embedding: number[] = data.data[0].embedding;

  if (!Array.isArray(embedding) || embedding.length !== 1024) {
    throw new Error(`Unexpected embedding shape: length=${embedding?.length}`);
  }

  return embedding;
}