import type { Context } from 'hono'

import { setAccessCookie } from '@/net/http'
import HttpStatus from '@/types/http-status'
import signUpWithEmail from '@/use-cases/auth/signup'

import type { SignupBody } from './schema'

const signupHandler = async (c: Context) => {
  const { firstName, lastName, email, password } = await c.req.json<SignupBody>()

  const result = await signUpWithEmail({ firstName, lastName: lastName ?? '', email, password })

  setAccessCookie(c, result.token)

  return c.json(result, HttpStatus.CREATED)
}

export default signupHandler
