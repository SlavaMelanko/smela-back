import { zValidator } from '@hono/zod-validator'
import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { sign } from 'hono/jwt'

import db from '@/db'
import { usersTable } from '@/db/schema'
import { createPasswordEncoder } from '@/lib/crypto'
import env from '@/lib/env'

import loginSchema from './schema'

const loginRoute = new Hono()

const TOKEN_EXPIRATION_TIME = 60 * 60 // 1 hour

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
    return c.json({ error: 'Invalid email or password' }, 401)
  }

  const payload = {
    id: user.id,
    email: user.email,
    role: 'user',
    exp: Math.floor(Date.now() / 1000) + TOKEN_EXPIRATION_TIME,
  }

  const token = await sign(payload, env.JWT_SECRET)

  return c.json({ token })
})

export default loginRoute
