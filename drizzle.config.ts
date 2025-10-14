import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

// Load environment-specific .env file
// eslint-disable-next-line node/no-process-env
const nodeEnv = process.env.NODE_ENV || 'development'

config({ path: `.env.${nodeEnv}` })

export default defineConfig({
  schema: './src/data/schema',
  out: './src/data/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    // eslint-disable-next-line node/no-process-env
    url: process.env.DB_URL!,
  },
  verbose: true,
  strict: true,
})
