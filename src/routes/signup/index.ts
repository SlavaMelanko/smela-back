import { eq } from 'drizzle-orm'
import { Hono } from 'hono'

import db from '@/db'
import { usersTable } from '@/db/schema'
import { createPasswordEncoder } from '@/lib/crypto'

import signupSchema from './schema'

const signupRoute = new Hono()

signupRoute.post('/signup', async (c) => {
  const body = await c.req.json()

  const parsed = signupSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Invalid input', details: parsed.error.flatten() }, 400)
  }

  const { firstName, lastName, email, password } = parsed.data

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email))

  if (existing.length > 0) {
    return c.json({ error: 'Email already in use' }, 409)
  }

  const encoder = createPasswordEncoder()
  const hashedPassword = await encoder.hash(password)

  const insertedUsers = await db
    .insert(usersTable)
    .values({
      firstName,
      lastName,
      email,
      password: hashedPassword,
    })
    .returning({
      id: usersTable.id,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      email: usersTable.email,
      createdAt: usersTable.createdAt,
    })

  return c.json({ success: true, user: insertedUsers[0] }, 201)
})

export default signupRoute
