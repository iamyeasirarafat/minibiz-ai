import { Router } from "express";
import OpenAI from "openai";
import { z } from "zod";
import {
  API_ROUTES,
  DEFAULT_LLM_MODEL,
  type ChatResponse,
} from "@minibiz-ai/shared";
import { ensureConversation, saveChatTurn, type Db } from "../db.js";

const chatBodySchema = z.object({
  systemPrompt: z.string().min(1, "systemPrompt is required"),
  userMessage: z.string().min(1, "userMessage is required"),
  conversationId: z.string().uuid().optional(),
  model: z.string().min(1).optional(),
});

export function createChatRouter(options: {
  db: Db;
  openai: OpenAI;
  defaultModel: string;
}): Router {
  const router = Router();

  router.post(API_ROUTES.chat, async (req, res) => {
    const parsed = chatBodySchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid request body",
        details: parsed.error.flatten(),
      });
      return;
    }

    const { systemPrompt, userMessage, conversationId, model } = parsed.data;
    const selectedModel = model ?? options.defaultModel ?? DEFAULT_LLM_MODEL;
    const startedAt = Date.now();

    try {
      const completion = await options.openai.chat.completions.create({
        model: selectedModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      });

      const responseTimeMs = Date.now() - startedAt;
      const assistantContent = completion.choices[0]?.message?.content?.trim();

      if (!assistantContent) {
        res.status(502).json({ error: "Model returned an empty response" });
        return;
      }

      const usage = {
        inputTokens: completion.usage?.prompt_tokens ?? 0,
        outputTokens: completion.usage?.completion_tokens ?? 0,
        responseTimeMs,
        model: completion.model ?? selectedModel,
      };

      const resolvedConversationId = await ensureConversation(
        options.db,
        conversationId,
        systemPrompt,
      );

      const { assistantMessageId } = await saveChatTurn(options.db, {
        conversationId: resolvedConversationId,
        systemPrompt,
        userMessage,
        assistantMessage: assistantContent,
        usage,
      });

      const body: ChatResponse = {
        conversationId: resolvedConversationId,
        message: {
          id: assistantMessageId,
          role: "assistant",
          content: assistantContent,
        },
        usage,
      };

      res.json(body);
    } catch (error) {
      console.error("[chat] failed", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Chat request failed",
      });
    }
  });

  return router;
}
