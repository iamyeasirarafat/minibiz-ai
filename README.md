# minibiz-ai

pnpm monorepo with a Next.js frontend, Express backend, and shared package.

## Structure

```text
apps/
  frontend/   # Next.js app (@minibiz-ai/frontend)
  backend/    # Express API (@minibiz-ai/backend)
packages/
  shared/     # Shared env, config, and types (@minibiz-ai/shared)
```

## Setup

1. Make sure local PostgreSQL is running.
2. Copy env and add your Groq API key:

```bash
pnpm install
cp .env.example .env
```

Default DB URL:

```text
postgresql://postgres@localhost:5432/minibiz_ai
```

Create the database once if needed:

```bash
createdb -U postgres minibiz_ai
```

Tables are created automatically when the backend starts.

## Develop

```bash
pnpm dev
```

- Frontend chat lab: http://localhost:3000
- Chat API: `POST http://localhost:4000/ai/chat`
- Health: http://localhost:4000/api/health

```json
{
  "systemPrompt": "You are a concise tutor.",
  "userMessage": "Explain tokens simply."
}
```

Each turn stores the conversation in PostgreSQL with input tokens, output tokens, response time, and model name.

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start frontend + backend |
| `pnpm build` | Build shared, backend, then frontend |
| `pnpm start` | Start production servers |
| `pnpm lint` | Typecheck / lint workspaces |
