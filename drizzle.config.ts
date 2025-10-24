import { defineConfig } from 'drizzle-kit'

// Bun automatically loads .env.${NODE_ENV} files
// eslint-disable-next-line node/no-process-env
const nodeEnv = process.env.NODE_ENV || 'development'

const createDbUrl = () => {
  const {
    POSTGRES_USER,
    POSTGRES_PASSWORD,
    POSTGRES_HOST,
    POSTGRES_PORT,
    POSTGRES_DB,
    // eslint-disable-next-line node/no-process-env
  } = process.env

  if (!POSTGRES_USER || !POSTGRES_PASSWORD || !POSTGRES_HOST || !POSTGRES_PORT || !POSTGRES_DB) {
    throw new Error('Missing required POSTGRES_* environment variable')
  }

  return `postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}`
}

export default defineConfig({
  schema: './src/data/schema',
  out: './src/data/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: createDbUrl(),
  },
  casing: 'snake_case',
  verbose: nodeEnv === 'development',
  strict: true,
})
