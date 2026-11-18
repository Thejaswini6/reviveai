/**
 * Environment Variable Validation
 * Ensures all required environment variables are set and valid
 */

import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  DATABASE_URL: z.string().default('./data/reviveai.db'),
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default('claude-haiku-4-5'),
  MOCK_MODE: z
    .string()
    .transform((v) => v === 'true' || v === '1')
    .default('true'),
  EMAIL_ADAPTER: z.enum(['mock', 'smtp']).default('mock'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug', 'trace']).default('info'),
  CORS_ORIGIN: z.string().default('http://localhost:5173,http://localhost:5000'),
  DEFAULT_BUSINESS_ID: z.string().default('business-001'),
  DEFAULT_BUSINESS_NAME: z.string().default('CoolCare AC Services'),
});

export type Env = z.infer<typeof EnvSchema>;

export function validateEnv(): Env {
  const env = process.env as Record<string, any>;

  try {
    return EnvSchema.parse(env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:');
      error.errors.forEach((err) => {
        console.error(`  ${err.path.join('.')}: ${err.message}`);
      });
    }
    throw error;
  }
}

// Validate on import
export const ENV = validateEnv();
