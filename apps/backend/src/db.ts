import { randomUUID } from "node:crypto";
import pg from "pg";
import type { ChatUsage } from "@minibiz-ai/shared";

const { Pool } = pg;

export type Db = pg.Pool;

export function createDb(databaseUrl: string): Db {
  return new Pool({ connectionString: databaseUrl });
}

export async function migrate(db: Db): Promise<void> {
  await db.query(`
    CREATE TABLE IF NOT EXISTS conversations (
      id UUID PRIMARY KEY,
      system_prompt TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS messages (
      id UUID PRIMARY KEY,
      conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      role TEXT NOT NULL CHECK (role IN ('system', 'user', 'assistant')),
      content TEXT NOT NULL,
      model TEXT,
      input_tokens INTEGER,
      output_tokens INTEGER,
      response_time_ms INTEGER,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS messages_conversation_id_created_at_idx
      ON messages (conversation_id, created_at);
  `);
}

export async function ensureConversation(
  db: Db,
  conversationId: string | undefined,
  systemPrompt: string,
): Promise<string> {
  const id = conversationId ?? randomUUID();

  await db.query(
    `
      INSERT INTO conversations (id, system_prompt)
      VALUES ($1, $2)
      ON CONFLICT (id) DO UPDATE
        SET system_prompt = EXCLUDED.system_prompt,
            updated_at = NOW()
    `,
    [id, systemPrompt],
  );

  return id;
}

export async function saveChatTurn(
  db: Db,
  params: {
    conversationId: string;
    systemPrompt: string;
    userMessage: string;
    assistantMessage: string;
    usage: ChatUsage;
  },
): Promise<{ assistantMessageId: string }> {
  const userMessageId = randomUUID();
  const assistantMessageId = randomUUID();
  const systemMessageId = randomUUID();

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `
        UPDATE conversations
        SET system_prompt = $2, updated_at = NOW()
        WHERE id = $1
      `,
      [params.conversationId, params.systemPrompt],
    );

    await client.query(
      `
        INSERT INTO messages (id, conversation_id, role, content)
        VALUES ($1, $2, 'system', $3)
      `,
      [systemMessageId, params.conversationId, params.systemPrompt],
    );

    await client.query(
      `
        INSERT INTO messages (id, conversation_id, role, content)
        VALUES ($1, $2, 'user', $3)
      `,
      [userMessageId, params.conversationId, params.userMessage],
    );

    await client.query(
      `
        INSERT INTO messages (
          id,
          conversation_id,
          role,
          content,
          model,
          input_tokens,
          output_tokens,
          response_time_ms
        )
        VALUES ($1, $2, 'assistant', $3, $4, $5, $6, $7)
      `,
      [
        assistantMessageId,
        params.conversationId,
        params.assistantMessage,
        params.usage.model,
        params.usage.inputTokens,
        params.usage.outputTokens,
        params.usage.responseTimeMs,
      ],
    );

    await client.query("COMMIT");
    return { assistantMessageId };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
