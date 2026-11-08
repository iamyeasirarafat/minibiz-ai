import cors from "cors";
import express from "express";
import OpenAI from "openai";
import {
  API_ROUTES,
  APP_NAME,
  parseBackendEnv,
  type HealthResponse,
} from "@minibiz-ai/shared";
import { createDb, migrate } from "./db.js";
import { createChatRouter } from "./routes/chat.js";

const env = parseBackendEnv();
const db = createDb(env.DATABASE_URL);
const openai = new OpenAI({
  apiKey: env.GROQ_API_KEY,
  baseURL: env.LLM_BASE_URL,
});
const app = express();

app.use(
  cors({
    origin: env.FRONTEND_ORIGIN,
  }),
);
app.use(express.json({ limit: "1mb" }));

app.get(API_ROUTES.health, (_req, res) => {
  const body: HealthResponse = {
    status: "ok",
    service: `${APP_NAME}-backend`,
    timestamp: new Date().toISOString(),
  };

  res.json(body);
});

app.use(createChatRouter({ db, openai, defaultModel: env.LLM_MODEL }));

async function main() {
  await migrate(db);

  app.listen(env.BACKEND_PORT, () => {
    console.log(`[${APP_NAME}] backend listening on http://localhost:${env.BACKEND_PORT}`);
  });
}

main().catch((error) => {
  console.error(`[${APP_NAME}] failed to start`, error);
  process.exit(1);
});
