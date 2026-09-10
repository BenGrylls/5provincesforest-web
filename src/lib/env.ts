import { z } from 'zod';

/**
 * Environment variable schema validation
 * Ensures all required vars are present and properly formatted
 */
const envSchema = z.object({
  // Database
  DATABASE_URL: z
    .string()
    .url('DATABASE_URL must be a valid URL')
    .refine(
      (url) => url.startsWith('postgresql://') || url.startsWith('postgres://'),
      'DATABASE_URL must be a PostgreSQL connection string'
    ),

  // Admin Authentication
  ADMIN_USERNAME: z
    .string()
    .min(3, 'ADMIN_USERNAME must be at least 3 characters')
    .max(50, 'ADMIN_USERNAME must be at most 50 characters'),

  ADMIN_PASSWORD: z
    .string()
    .min(8, 'ADMIN_PASSWORD must be at least 8 characters')
    .max(128, 'ADMIN_PASSWORD must be at most 128 characters'),

  ADMIN_SESSION_TOKEN: z
    .string()
    .min(20, 'ADMIN_SESSION_TOKEN must be at least 20 characters')
    .max(255, 'ADMIN_SESSION_TOKEN must be at most 255 characters'),

  // Optional
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type Environment = z.infer<typeof envSchema>;

/**
 * Validate and parse environment variables
 * @throws {z.ZodError} if validation fails
 * @returns Validated environment object
 */
export function validateEnvironment(): Environment {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    const errorMessages = Object.entries(errors)
      .map(([field, msgs]) => `  ${field}: ${msgs?.join(', ') || 'Invalid value'}`)
      .join('\n');

    throw new Error(
      `❌ Environment validation failed:\n${errorMessages}\n\nPlease check your .env file.`
    );
  }

  return result.data;
}

/**
 * Get validated environment variables
 * Caches result to avoid re-validation
 */
let cachedEnv: Environment | null = null;

export function getEnvironment(): Environment {
  if (!cachedEnv) {
    cachedEnv = validateEnvironment();
  }
  return cachedEnv;
}
