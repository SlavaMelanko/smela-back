import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'

import env from '@/lib/env'

const sql = neon(env.DB_URL)

const db = drizzle({ client: sql })

export default db
