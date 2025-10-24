import { z } from 'zod'

export const dbEnvVars = {
  POSTGRES_USER: z.string().min(5),
  POSTGRES_PASSWORD: z.string()
    .min(8)
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/, 'Password must contain at least one symbol'),
  POSTGRES_HOST: z.string().min(5).default('localhost'),
  POSTGRES_PORT: z.string()
    .transform(val => Number(val))
    .pipe(z.number().int().min(1).max(65535).default(5432)),
  POSTGRES_DB: z.string().min(5),
  POSTGRES_MAX_CONNECTIONS: z.coerce.number().int().min(1).max(10).default(2),
}

export const createDbUrl = (
  user: string,
  password: string,
  host: string,
  port: number,
  db: string,
): string => `postgresql://${user}:${password}@${host}:${port}/${db}`
