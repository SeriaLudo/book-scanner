import 'dotenv/config';
import {z} from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(8787),
  DATABASE_URL: z
    .string()
    .url()
    .default('postgres://book_scanner:book_scanner@localhost:5432/book_scanner'),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  CLERK_SECRET_KEY: z.string().min(1).optional(),
});

export const env = envSchema.parse(process.env);
