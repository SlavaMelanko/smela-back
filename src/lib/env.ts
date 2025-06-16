import { config } from 'dotenv'
import { z } from 'zod'

// Load environment variables from .env file
config()

// Define schema for required environment variables
const envSchema = z.object({
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  DB_URL: z.string().url('DB_URL must be a valid URL'),
})

// eslint-disable-next-line node/no-process-env
const parsedEnv = envSchema.safeParse(process.env)

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', parsedEnv.error.format())

  process.exit(1)
}

const env = parsedEnv.data

export default env
