// Bun automatically loads .env files based on NODE_ENV
// No need to import and configure dotenv
import { defineConfig } from 'drizzle-kit'

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
