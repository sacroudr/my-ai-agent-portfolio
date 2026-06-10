import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";
import { kbChunks } from "../lib/db/schema";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

// -------------------------------------------------------------------
// CONFIG
// -------------------------------------------------------------------
const CHUNK_SIZE = 400;
const CHUNK_OVERLAP = 50;
const KB_DIR = path.join(process.cwd(), "knowledge-base");
const VOYAGE_API_URL = "https://api.voyageai.com/v1/embeddings";
const VOYAGE_MODEL = "voyage-3"; // 1024 dimensions

// -------------------------------------------------------------------
// DB
// -------------------------------------------------------------------
if (!process.env.DATABASE_URL) throw new Error("Missing DATABASE_URL in .env.local");
if (!process.env.VOYAGE_API_KEY) throw new Error("Missing VOYAGE_API_KEY in .env.local");

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

// -------------------------------------------------------------------
// STEP 1 — Read all .md files
// -------------------------------------------------------------------
function readKbFiles(): { sourceFile: string; content: string }[] {
  if (!fs.existsSync(KB_DIR)) {
    throw new Error(`knowledge-base directory not found at: ${KB_DIR}`);
  }
  const files = fs.readdirSync(KB_DIR).filter((f) => f.endsWith(".md"));
  if (files.length === 0) throw new Error("No .md files found in /knowledge-base");

  console.log(`📂 Found ${files.length} files: ${files.join(", ")}`);
  return files.map((file) => ({
    sourceFile: file.replace(".md", ""),
    content: fs.readFileSync(path.join(KB_DIR, file), "utf-8"),
  }));
}

// -------------------------------------------------------------------
// STEP 2 — Chunk
// -------------------------------------------------------------------
function chunkText(
  text: string,
  sourceFile: string
): { content: string; chunkIndex: number; sourceFile: string }[] {
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  const chunks: { content: string; chunkIndex: number; sourceFile: string }[] = [];
  let i = 0;
  let chunkIndex = 0;

  while (i < words.length) {
    const content = words.slice(i, i + CHUNK_SIZE).join(" ").trim();
    if (content.length > 0) {
      chunks.push({ content, chunkIndex, sourceFile });
      chunkIndex++;
    }
    i += CHUNK_SIZE - CHUNK_OVERLAP;
  }
  return chunks;
}

// -------------------------------------------------------------------
// STEP 3 — Embed via Voyage AI
// -------------------------------------------------------------------
async function embedChunks(texts: string[]): Promise<number[][]> {
  const BATCH_SIZE = 64;
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    console.log(`  🔢 Embedding batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(texts.length / BATCH_SIZE)}...`);

    const response = await fetch(VOYAGE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
      },
      body: JSON.stringify({
        model: VOYAGE_MODEL,
        input: batch,
        input_type: "document",
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Voyage AI error: ${response.status} — ${error}`);
    }

    const data = await response.json();

    // Validate the response shape before using it
    if (!data.data || !Array.isArray(data.data)) {
      throw new Error(`Unexpected Voyage AI response shape: ${JSON.stringify(data).substring(0, 200)}`);
    }

    const batchEmbeddings = data.data.map((item: { embedding: number[] }) => {
      if (!Array.isArray(item.embedding)) {
        throw new Error(`Embedding is not an array: ${JSON.stringify(item).substring(0, 100)}`);
      }
      // Ensure all values are proper JS numbers, not strings
      return item.embedding.map((v: unknown) => Number(v));
    });

    allEmbeddings.push(...batchEmbeddings);

    if (i + BATCH_SIZE < texts.length) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  return allEmbeddings;
}

// -------------------------------------------------------------------
// STEP 4 — Clear + insert one chunk at a time to isolate any failure
// -------------------------------------------------------------------
async function clearAndInsert(
  chunks: { content: string; chunkIndex: number; sourceFile: string; embedding: number[] }[]
) {
  // Clear existing
  const sourceFiles = [...new Set(chunks.map((c) => c.sourceFile))];
  console.log("\n🗑  Clearing existing chunks...");
  for (const sourceFile of sourceFiles) {
    await db.delete(kbChunks).where(eq(kbChunks.sourceFile, sourceFile));
  }
  console.log(`   Cleared ${sourceFiles.length} source files`);

  // Insert one at a time to catch exactly which chunk fails if any
  console.log(`\n💾 Inserting ${chunks.length} chunks one by one...`);
  let inserted = 0;

  for (const chunk of chunks) {
    try {
      // Explicitly convert embedding to array of numbers
      const embedding = chunk.embedding.map(Number);

      // Sanity checks
      if (embedding.length !== 1024) {
        throw new Error(`Wrong embedding dimensions: ${embedding.length} (expected 1024)`);
      }
      if (embedding.some(isNaN)) {
        throw new Error(`Embedding contains NaN values`);
      }

      await db.insert(kbChunks).values({
        content: chunk.content,
        sourceFile: chunk.sourceFile,
        chunkIndex: chunk.chunkIndex,
        embedding: embedding,
      });

      inserted++;
      console.log(`   ✓ [${inserted}/${chunks.length}] ${chunk.sourceFile}[${chunk.chunkIndex}]`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`   ✗ FAILED on ${chunk.sourceFile}[${chunk.chunkIndex}]: ${message}`);
      throw err; // Stop on first failure so we can see the exact error
    }
  }
}

// -------------------------------------------------------------------
// MAIN
// -------------------------------------------------------------------
async function main() {
  console.log("\n🚀 Starting KB ingestion pipeline...\n");

  const files = readKbFiles();

  console.log("\n✂️  Chunking...");
  const allChunks: { content: string; chunkIndex: number; sourceFile: string }[] = [];
  for (const file of files) {
    const chunks = chunkText(file.content, file.sourceFile);
    allChunks.push(...chunks);
    console.log(`  📄 ${file.sourceFile}: ${chunks.length} chunk(s)`);
  }
  console.log(`  Total: ${allChunks.length} chunks`);

  console.log("\n🧠 Embedding...");
  const embeddings = await embedChunks(allChunks.map((c) => c.content));

  // Log first embedding to verify format
  console.log(`  First embedding: length=${embeddings[0].length}, sample=[${embeddings[0].slice(0, 3).join(", ")}...]`);

  const chunksWithEmbeddings = allChunks.map((chunk, i) => ({
    ...chunk,
    embedding: embeddings[i],
  }));

  await clearAndInsert(chunksWithEmbeddings);

  // Final verification
  const rows = await db.select().from(kbChunks);
  console.log(`\n✅ Final row count in kb_chunks: ${rows.length}`);

  if (rows.length === 0) {
    throw new Error("Table empty after insert");
  }

  console.log("🎉 Done!\n");
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error("\n❌ Ingestion failed:", message);
  process.exit(1);
});