-- Backfills the drift between schema.ts and migration 0000: `tokens_used` was
-- applied to the live database out-of-band and never captured in a migration.
-- IF NOT EXISTS keeps this replayable against BOTH a fresh database (where it
-- creates the column) and the live one (where it is already present).
ALTER TABLE "chat_messages" ADD COLUMN IF NOT EXISTS "tokens_used" integer DEFAULT 0;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_messages_session_id_idx" ON "chat_messages" USING btree ("session_id");