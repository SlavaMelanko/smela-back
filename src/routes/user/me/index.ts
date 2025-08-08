import { Hono } from 'hono'

import type { AppContext } from '@/types/context'

import db from '@/db'
import { requestValidator } from '@/lib/validation'

import updateProfile from './handler'
import updateProfileSchema from './schema'

const meRoute = new Hono<AppContext>()

meRoute.get('/me', async (c) => {
  const user = c.get('user')

  const { rows } = await db.execute(`select version()`)

  return c.json({ user, db: { version: rows[0]?.version } })
})

meRoute.post('/me', requestValidator('json', updateProfileSchema), updateProfile)

export default meRoute
