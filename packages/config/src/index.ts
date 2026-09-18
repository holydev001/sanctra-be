import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z
    .string()
    .url()
    .default('postgresql://sanctra:sanctra@localhost:5432/sanctra?schema=public'),
  REDIS_URL: z.string().url().default('redis://localhost:6379'),
  S3_ENDPOINT: z.string().url().default('http://localhost:9000'),
  S3_REGION: z.string().default('us-east-1'),
  S3_BUCKET: z.string().default('sanctra-local'),
  S3_ACCESS_KEY_ID: z.string().default('sanctra'),
  S3_SECRET_ACCESS_KEY: z.string().default('sanctra-local-secret'),
  GITHUB_OAUTH_CLIENT_ID: z.string().optional(),
  GITHUB_OAUTH_CLIENT_SECRET: z.string().optional(),
  GITHUB_APP_ID: z.string().optional(),
  GITHUB_APP_PRIVATE_KEY: z.string().optional(),
  GITHUB_WEBHOOK_SECRET: z.string().optional(),
  SESSION_SECRET: z.string().min(32).default('local-development-session-secret-change-me'),
  SENTRY_DSN: z.string().url().optional(),
});

export type AppEnv = z.infer<typeof envSchema>;

export function parseEnv(input: NodeJS.ProcessEnv = process.env): AppEnv {
  return envSchema.parse(input);
}
