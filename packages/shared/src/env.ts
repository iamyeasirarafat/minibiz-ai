import { z } from "zod";

const nodeEnvSchema = z.enum(["development", "test", "production"]).default("development");

export const sharedEnvSchema = z.object({
  NODE_ENV: nodeEnvSchema,
});

export const backendEnvSchema = sharedEnvSchema.extend({
  BACKEND_PORT: z.coerce.number().int().positive().default(4000),
  FRONTEND_ORIGIN: z.string().url().default("http://localhost:3000"),
});

export const frontendEnvSchema = sharedEnvSchema.extend({
  NEXT_PUBLIC_API_URL: z.string().url().default("http://localhost:4000"),
});

export type SharedEnv = z.infer<typeof sharedEnvSchema>;
export type BackendEnv = z.infer<typeof backendEnvSchema>;
export type FrontendEnv = z.infer<typeof frontendEnvSchema>;

export function parseBackendEnv(env: NodeJS.ProcessEnv = process.env): BackendEnv {
  return backendEnvSchema.parse(env);
}

export function parseFrontendEnv(env: NodeJS.ProcessEnv = process.env): FrontendEnv {
  return frontendEnvSchema.parse(env);
}
