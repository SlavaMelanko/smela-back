import type { Context } from 'hono'

import { setAccessCookie } from '@/lib/cookie'
import HttpStatus from '@/lib/http-status'

import type { SignupBody } from './schema'

import signUpWithEmail from './signup'

const signupHandler = async (c: Context) => {
  const { firstName, lastName, email, password } = await c.req.json<SignupBody>()

  const result = await signUpWithEmail({ firstName, lastName: lastName ?? '', email, password })

  setAccessCookie(c, result.token)

  return c.json(result, HttpStatus.CREATED)
}

export default signupHandler
