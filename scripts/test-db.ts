import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { kbChunks } from "../lib/db/schema";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function test() {
  console.log("\n🔍 Testing DB connection...\n");

  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL is missing from .env.local");
    process.exit(1);
  }

  console.log("✅ DATABASE_URL found");
  console.log(`   Value starts with: ${process.env.DATABASE_URL.substring(0, 30)}...`);

  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql);

  // Step 1: raw ping
  try {
    const result = await sql`SELECT 1 as ping`;
    console.log("\n✅ Raw SQL ping succeeded:", result);
  } catch (err: any) {
    console.error("\n❌ Raw SQL ping failed:", err.message);
    process.exit(1);
  }

  // Step 2: count rows in kb_chunks
  try {
    const rows = await db.select().from(kbChunks);
    console.log(`\n✅ kb_chunks query succeeded — current row count: ${rows.length}`);
  } catch (err: any) {
    console.error("\n❌ kb_chunks query failed:", err.message);
    process.exit(1);
  }

  // Step 3: insert a single test row with a dummy embedding
  try {
    console.log("\n🧪 Inserting a single test row...");
    await db.insert(kbChunks).values({
      content: "TEST CHUNK — delete me",
      sourceFile: "test",
      chunkIndex: 0,
      embedding: Array(1024).fill(0.1), // dummy 1024-dim vector
    });
    console.log("✅ Insert succeeded");
  } catch (err: any) {
    console.error("❌ Insert failed:", err.message);
    process.exit(1);
  }

  // Step 4: verify the row is there
  try {
    const rows = await db.select().from(kbChunks);
    console.log(`\n✅ Row count after insert: ${rows.length}`);
    if (rows.length === 0) {
      console.error("❌ Insert appeared to succeed but table is still empty");
    } else {
      console.log("✅ Data is persisting correctly\n");
    }
  } catch (err: any) {
    console.error("❌ Verification query failed:", err.message);
  }
}

test().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});