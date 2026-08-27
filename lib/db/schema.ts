import { pgTable, text, integer, timestamp, vector, index, uuid } from "drizzle-orm/pg-core";

// -------------------------------------------------------------------
// TABLE 1 — kb_chunks
// Stores your knowledge base content split into chunks,
// each with its vector embedding for similarity search.
// -------------------------------------------------------------------
export const kbChunks = pgTable(
  "kb_chunks",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // The raw text content of this chunk (what the LLM will read)
    content: text("content").notNull(),

    // Which .md file this chunk came from (e.g. "skills", "experience")
    sourceFile: text("source_file").notNull(),

    // Position of this chunk within its source file (0-indexed)
    chunkIndex: integer("chunk_index").notNull(),

    // The vector embedding — 1024 dimensions (Voyage AI voyage-3 output size)
    embedding: vector("embedding", { dimensions: 1024 }).notNull(),

    // When this chunk was indexed (useful for knowing when to re-index)
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    // HNSW index for fast approximate nearest-neighbor search
    // This is what makes pgvector similarity search fast at scale
    embeddingIndex: index("kb_chunks_embedding_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops")
    ),
  })
);

// -------------------------------------------------------------------
// TABLE 2 — chat_sessions
// Each time a user opens the app, a session is created.
// Lightweight — just an ID and a timestamp.
// Useful later for analytics (how many people used it, when, etc.)
// -------------------------------------------------------------------
export const chatSessions = pgTable("chat_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),

  // Browser-generated session identifier (so we don't need auth)
  sessionId: text("session_id").notNull().unique(),

  // "fr" or "en" — detected at session start
  language: text("language", { enum: ["fr", "en"] }).default("en").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// -------------------------------------------------------------------
// TABLE 3 — chat_messages
// Every message exchanged in a session — both user and agent.
// Stored for potential future features (analytics, conversation history).
// -------------------------------------------------------------------
export const chatMessages = pgTable(
  "chat_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Links to the session this message belongs to
    sessionId: text("session_id")
      .notNull()
      .references(() => chatSessions.sessionId, { onDelete: "cascade" }),

    // "user" = human message, "assistant" = agent response
    role: text("role", { enum: ["user", "assistant"] }).notNull(),

    // The actual message content
    content: text("content").notNull(),

    // Language this message was written/responded in
    language: text("language", { enum: ["fr", "en"] }).default("en").notNull(),

    // Token used for the request
    tokensUsed: integer("tokens_used").default(0),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    // Postgres does not index foreign keys automatically. The admin transcript
    // view filters by session_id on every request, so this keeps it off a seq scan.
    sessionIdIndex: index("chat_messages_session_id_idx").on(table.sessionId),
  })
);

// -------------------------------------------------------------------
// TYPE EXPORTS
// Inferred TypeScript types from the schema — use these throughout
// the app instead of defining types manually.
// -------------------------------------------------------------------
export type KbChunk = typeof kbChunks.$inferSelect;
export type NewKbChunk = typeof kbChunks.$inferInsert;

export type ChatSession = typeof chatSessions.$inferSelect;
export type NewChatSession = typeof chatSessions.$inferInsert;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type NewChatMessage = typeof chatMessages.$inferInsert;