import { dbRules } from '../validation'

export const dbEnv = {
  DB_URL: dbRules.url,
  DB_MAX_CONNECTIONS: dbRules.maxConnections,
}
