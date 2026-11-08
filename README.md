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

The shared workspace package (`packages/shared`) is where env schemas, config constants, and shared TypeScript types live so both apps stay in sync.

## Setup

```bash
pnpm install
cp .env.example .env
pnpm --filter @minibiz-ai/shared build
```

## Develop

From the repo root:

```bash
pnpm dev
```

- Frontend: http://localhost:3000
- Backend health: http://localhost:4000/api/health

Individual apps:

```bash
pnpm dev:frontend
pnpm dev:backend
```

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start frontend + backend |
| `pnpm build` | Build shared, backend, then frontend |
| `pnpm start` | Start production servers |
| `pnpm lint` | Typecheck / lint workspaces |
