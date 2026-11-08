export type HealthStatus = "ok" | "degraded" | "error";

export interface HealthResponse {
  status: HealthStatus;
  service: string;
  timestamp: string;
}

export interface ChatRequest {
  systemPrompt: string;
  userMessage: string;
  conversationId?: string;
  model?: string;
}

export interface ChatUsage {
  inputTokens: number;
  outputTokens: number;
  responseTimeMs: number;
  model: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}

export interface ChatResponse {
  conversationId: string;
  message: {
    id: string;
    role: "assistant";
    content: string;
  };
  usage: ChatUsage;
}
