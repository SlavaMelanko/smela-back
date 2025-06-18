import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'

import { createPasswordEncoder } from '@/lib/crypto'
import jwt from '@/lib/jwt'
import { userRepo } from '@/repositories'

import loginSchema from './schema'

const loginRoute = new Hono()

loginRoute.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = await c.req.json()

  const user = await userRepo.findByEmail(email)

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
