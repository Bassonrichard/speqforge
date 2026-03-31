import { z } from 'zod';

const envSchema = z.object({
  // Next.js / Node
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL').or(z.string().startsWith('file:')),
  
  // GitHub App
  GITHUB_APP_ID: z.string().min(1, 'GITHUB_APP_ID is required'),
  GITHUB_APP_PRIVATE_KEY: z.string().min(10, 'GITHUB_APP_PRIVATE_KEY is required'),
  GITHUB_APP_WEBHOOK_SECRET: z.string().min(1, 'GITHUB_APP_WEBHOOK_SECRET is required'),
  
  // GitHub OAuth
  GITHUB_OAUTH_CLIENT_ID: z.string().optional(),
  GITHUB_OAUTH_CLIENT_SECRET: z.string().optional(),
  
  // OpenAI OAuth (for Codex)
  OPENAI_OAUTH_CLIENT_ID: z.string().optional(),
  OPENAI_OAUTH_CLIENT_SECRET: z.string().optional(),
  
  // LLM Providers (BYOK - optionally set defaults, but users will provide keys)
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  
  // Encryption
  ENCRYPTION_KEY: z.string().min(32, 'ENCRYPTION_KEY must be at least 32 characters').optional(),
  
  // Base URL
  NEXTAUTH_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().optional(),
  
  // Environment flags
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  ENABLE_EXPERIMENTAL_FEATURES: z.string().transform(v => v === 'true').default(() => false),
});

export type Env = z.infer<typeof envSchema>;

// Parse and validate environment variables
export const env = envSchema.parse(process.env);

// Utility to check if a specific provider is configured
export function isProviderConfigured(provider: 'openai' | 'anthropic'): boolean {
  switch (provider) {
    case 'openai':
      return Boolean(env.OPENAI_API_KEY);
    case 'anthropic':
      return Boolean(env.ANTHROPIC_API_KEY);
    default:
      return false;
  }
}

// Get concatenated warning for missing critical env vars
export function getEnvWarnings(): string[] {
  const warnings: string[] = [];
  
  if (!env.GITHUB_OAUTH_CLIENT_ID || !env.GITHUB_OAUTH_CLIENT_SECRET) {
    warnings.push('GitHub OAuth not fully configured (GITHUB_OAUTH_CLIENT_ID or CLIENT_SECRET missing)');
  }
  
  if (!env.NEXTAUTH_SECRET) {
    warnings.push('NEXTAUTH_SECRET not set (authentication may not work properly)');
  }
  
  if (!env.NEXTAUTH_URL && env.NODE_ENV === 'production') {
    warnings.push('NEXTAUTH_URL not set in production (redirects may fail)');
  }
  
  if (!env.ENCRYPTION_KEY) {
    warnings.push('ENCRYPTION_KEY not set (BYOK key encryption will not work)');
  }
  
  return warnings;
}
