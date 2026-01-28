import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  ADMIN_EMAIL: z.string().email(),
  ADMIN_PASSWORD: z.string().min(6),
  S3_ENDPOINT: z.string().min(1),
  S3_REGION: z.string().min(1),
  S3_ACCESS_KEY_ID: z.string().min(1),
  S3_SECRET_ACCESS_KEY: z.string().min(1),
  S3_BUCKET: z.string().min(1),
  S3_PUBLIC_BASE_URL: z.string().optional(),
  SIGNED_URLS_ENABLED: z.string().optional(),
  PRINT_SERVER_URL: z.string().optional(),
  PRINT_SERVER_API_KEY: z.string().optional(),
  WEBSOCKET_PUBLIC_URL: z.string().optional()
});

export const env = envSchema.parse(process.env);
