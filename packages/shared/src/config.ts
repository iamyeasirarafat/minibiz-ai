export const APP_NAME = "minibiz-ai";

export const API_ROUTES = {
  health: "/api/health",
  chat: "/ai/chat",
} as const;

export const DEFAULT_PORTS = {
  frontend: 3000,
  backend: 4000,
} as const;

export const DEFAULT_LLM_MODEL = "openai/gpt-oss-120b";

export const DEFAULT_SYSTEM_PROMPT =
  "You are a helpful assistant. Be clear and concise so the user can study how the model behaves.";
