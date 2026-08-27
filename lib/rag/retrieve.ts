import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

const TOP_K = 4; // Number of chunks to retrieve per query

export interface RetrievedChunk {
  content: string;
  sourceFile: string;
  chunkIndex: number;
  similarity: number;
}

/**
 * Runs a cosine similarity search against kb_chunks using pgvector.
 * Returns the TOP_K most semantically relevant chunks for the given query embedding.
 */
export async function retrieveRelevantChunks(
  queryEmbedding: number[]
): Promise<RetrievedChunk[]> {
  // Format the embedding as a pgvector literal string: '[0.1,0.2,...]'
  const vectorLiteral = `[${queryEmbedding.join(",")}]`;

  // cosine_distance returns 0 (identical) to 2 (opposite)
  // We convert to similarity: 1 - distance, so 1 = perfect match
  const results = await db.execute(sql`
    SELECT
      content,
      source_file,
      chunk_index,
      1 - (embedding <=> ${vectorLiteral}::vector) AS similarity
    FROM kb_chunks
    ORDER BY embedding <=> ${vectorLiteral}::vector
    LIMIT ${TOP_K}
  `);

  return (results.rows as Array<Record<string, unknown>>).map((row) => ({
    content: row.content as string,
    sourceFile: row.source_file as string,
    chunkIndex: row.chunk_index as number,
    similarity: parseFloat(row.similarity as string),
  }));
}
