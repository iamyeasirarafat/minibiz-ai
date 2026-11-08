"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  API_ROUTES,
  DEFAULT_SYSTEM_PROMPT,
  type ChatResponse,
  type ChatUsage,
} from "@minibiz-ai/shared";

type UiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  usage?: ChatUsage;
};

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:4000";

export function ChatLab() {
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isSending]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const userMessage = input.trim();
    if (!userMessage || isSending) return;

    setError(null);
    setIsSending(true);
    setInput("");
    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), role: "user", content: userMessage },
    ]);

    try {
      const response = await fetch(`${apiBaseUrl}${API_ROUTES.chat}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemPrompt,
          userMessage,
          conversationId,
        }),
      });

      const payload = (await response.json()) as ChatResponse & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Chat request failed");
      }

      setConversationId(payload.conversationId);
      setMessages((current) => [
        ...current,
        {
          id: payload.message.id,
          role: "assistant",
          content: payload.message.content,
          usage: payload.usage,
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSending(false);
    }
  }

  function startNewConversation() {
    setConversationId(undefined);
    setMessages([]);
    setError(null);
    setInput("");
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs tracking-[0.18em] text-accent uppercase">
            minibiz-ai
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
            LLM Lab
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
            Change the system prompt, send a message, and inspect tokens, latency,
            and model behavior.
          </p>
        </div>
        <button
          type="button"
          onClick={startNewConversation}
          className="self-start rounded-md border border-panel-border bg-panel px-3 py-2 text-sm text-foreground transition hover:border-accent hover:text-accent"
        >
          New conversation
        </button>
      </header>

      <section className="grid flex-1 gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <label className="flex min-h-64 flex-col gap-2 rounded-xl border border-panel-border bg-panel p-4 shadow-[0_20px_50px_rgba(20,32,27,0.05)]">
          <span className="text-sm font-medium text-foreground">System prompt</span>
          <textarea
            value={systemPrompt}
            onChange={(event) => setSystemPrompt(event.target.value)}
            className="min-h-48 flex-1 resize-y rounded-lg border border-panel-border bg-[#fbfaf6] px-3 py-3 font-mono text-sm leading-6 text-foreground outline-none transition focus:border-accent"
            placeholder="Tell the model how to behave..."
          />
          <span className="text-xs text-muted">
            This is sent with every request so you can experiment freely.
          </span>
        </label>

        <div className="flex min-h-112 flex-col overflow-hidden rounded-xl border border-panel-border bg-panel shadow-[0_20px_50px_rgba(20,32,27,0.05)]">
          <div className="border-b border-panel-border px-4 py-3">
            <p className="text-sm font-medium text-foreground">Conversation</p>
            <p className="font-mono text-xs text-muted">
              {conversationId ? `id ${conversationId}` : "No messages saved yet"}
            </p>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {messages.length === 0 ? (
              <div className="rounded-lg bg-accent-soft px-4 py-5 text-sm leading-6 text-accent">
                Start by editing the system prompt, then ask something. Each turn is
                saved to PostgreSQL with token and latency metrics.
              </div>
            ) : (
              messages.map((message) => (
                <article
                  key={message.id}
                  className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                    message.role === "user"
                      ? "ml-auto bg-user-bubble text-white"
                      : "bg-assistant-bubble text-foreground"
                  }`}
                >
                  <p className="mb-1 font-mono text-[11px] tracking-wide uppercase opacity-70">
                    {message.role}
                  </p>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  {message.usage ? (
                    <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-black/10 pt-3 font-mono text-[11px] text-muted sm:grid-cols-4">
                      <div>
                        <dt>in</dt>
                        <dd className="text-foreground">{message.usage.inputTokens}</dd>
                      </div>
                      <div>
                        <dt>out</dt>
                        <dd className="text-foreground">{message.usage.outputTokens}</dd>
                      </div>
                      <div>
                        <dt>ms</dt>
                        <dd className="text-foreground">{message.usage.responseTimeMs}</dd>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <dt>model</dt>
                        <dd className="truncate text-foreground">{message.usage.model}</dd>
                      </div>
                    </dl>
                  ) : null}
                </article>
              ))
            )}
            {isSending ? (
              <p className="font-mono text-xs text-muted">Waiting for the model...</p>
            ) : null}
            <div ref={bottomRef} />
          </div>

          <form
            onSubmit={sendMessage}
            className="border-t border-panel-border bg-[#fbfaf6] p-4"
          >
            {error ? (
              <p className="mb-3 rounded-md bg-[#f8e8e8] px-3 py-2 text-sm text-danger">
                {error}
              </p>
            ) : null}
            <div className="flex flex-col gap-3 sm:flex-row">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                rows={3}
                className="min-h-22 flex-1 resize-y rounded-lg border border-panel-border bg-panel px-3 py-3 text-sm leading-6 text-foreground outline-none transition focus:border-accent"
                placeholder="Ask the model something..."
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
              />
              <button
                type="submit"
                disabled={isSending || !input.trim() || !systemPrompt.trim()}
                className="rounded-lg bg-accent px-4 py-3 text-sm font-medium text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 sm:self-end"
              >
                {isSending ? "Sending..." : "Send"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
