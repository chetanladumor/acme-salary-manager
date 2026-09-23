import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5001').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CLIENT_URL: z.string().default('http://localhost:5174'),
  DATABASE_URL: z.string().optional(),
  JWT_SECRET: z.string().default('dev_jwt_secret_key_acme_2026_super_secure'),
  SEED_ADMIN_PASSWORD: z.string().default('Admin#Pass2026!'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment configuration:', _env.error.format());
  process.exit(1);
}

export const env = _env.data;
