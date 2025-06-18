import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'

import { createPasswordEncoder } from '@/lib/crypto'
import { userRepo } from '@/repositories'

import signupSchema from './schema'

const signupRoute = new Hono()

signupRoute.post('/signup', zValidator('json', signupSchema), async (c) => {
  const { firstName, lastName, email, password } = await c.req.json()

  const existingUser = await userRepo.findByEmail(email)

  if (existingUser) {
    return c.json({ error: 'Email already in use' }, 409)
  }

  const encoder = createPasswordEncoder()
  const hashedPassword = await encoder.hash(password)

  const newUser = await userRepo.create({
    firstName,
    lastName,
    email,
    password: hashedPassword,
  })

  return c.json({ success: true, user: newUser }, 201)
})

export default signupRoute
