import { Hono } from 'hono'

import db from '@/db'
import type { Variables } from '@/types/context'

const meRoute = new Hono<{ Variables: Variables }>()

meRoute.get('/me', async (c) => {
  const user = c.get('user')

  const { rows } = await db.execute(`select version()`)

  return c.json({ user, db: { version: rows[0]?.version } })
})

export default meRoute
