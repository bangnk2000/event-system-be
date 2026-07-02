import { z } from 'zod';

export const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().url(),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  // Optional integrations — empty falls back to stubs / dev auth.
  CHATWORK_API_TOKEN: z.string().optional(),
  CHATWORK_ROOM_ID: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  // Secret for the anonymous survey respondent token (HMAC). Falls back to a dev default when unset;
  // set a strong value in production so response tokens cannot be forged/correlated.
  SURVEY_RESPONDENT_SALT: z.string().optional(),
});

export type AppConfig = z.infer<typeof configSchema>;

/** Thrown (technical failure) — boot must abort on bad config. */
export function validateConfig(raw: Record<string, unknown>): AppConfig {
  return configSchema.parse(raw);
}
