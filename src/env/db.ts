import { z } from 'zod'

export const dbEnvVars = {
  DB_URL: z.string().url(),
  DB_MAX_CONNECTIONS: z.coerce.number().int().min(1).max(10).default(2),
}
