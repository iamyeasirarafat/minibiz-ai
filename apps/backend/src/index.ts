import cors from "cors";
import express from "express";
import {
  API_ROUTES,
  APP_NAME,
  parseBackendEnv,
  type HealthResponse,
} from "@minibiz-ai/shared";

const env = parseBackendEnv();
const app = express();

app.use(
  cors({
    origin: env.FRONTEND_ORIGIN,
  }),
);
app.use(express.json());

app.get(API_ROUTES.health, (_req, res) => {
  const body: HealthResponse = {
    status: "ok",
    service: `${APP_NAME}-backend`,
    timestamp: new Date().toISOString(),
  };

  res.json(body);
});

app.listen(env.BACKEND_PORT, () => {
  console.log(`[${APP_NAME}] backend listening on http://localhost:${env.BACKEND_PORT}`);
});
