import type { Context } from 'hono'

import { HttpStatus, setAccessCookie } from '@/net/http'
import signUpWithEmail from '@/use-cases/auth/signup'

import type { SignupBody } from './schema'

const signupHandler = async (c: Context) => {
  const { firstName, lastName, email, password } = await c.req.json<SignupBody>()

  const { data, accessToken } = await signUpWithEmail({
    firstName,
    lastName: lastName ?? '',
    email,
    password,
  })

  setAccessCookie(c, accessToken)

  return c.json(data, HttpStatus.CREATED)
}

export default signupHandler
