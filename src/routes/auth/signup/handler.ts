import type { Context } from 'hono'

import { setAccessCookie } from '@/lib/cookie'
import { HttpStatus } from '@/lib/http-status'

import signUpWithEmail from './signup'

const signupHandler = async (c: Context) => {
  const { firstName, lastName, email, password, role } = await c.req.json()

  const result = await signUpWithEmail({ firstName, lastName, email, password, role })

  setAccessCookie(c, result.token)

  return c.json(result, HttpStatus.CREATED)
}

export default signupHandler
