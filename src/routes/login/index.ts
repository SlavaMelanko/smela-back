import { zValidator } from '@hono/zod-validator'
import { eq } from 'drizzle-orm'
import { Hono } from 'hono'

import db from '@/db'
import { usersTable } from '@/db/schema'
import { createPasswordEncoder } from '@/lib/crypto'
import jwt from '@/lib/jwt'

import loginSchema from './schema'

const loginRoute = new Hono()

loginRoute.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = await c.req.json()

  const users = await db.select().from(usersTable).where(eq(usersTable.email, email))

  const user = users[0]

  if (!user) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }

  const encoder = createPasswordEncoder()
  const isPasswordValid = await encoder.compare(password, user.password)

  if (!isPasswordValid) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }

  const token = await jwt.sign(user.id, user.email, 'user')

  return c.json({ token })
})

export default loginRoute
