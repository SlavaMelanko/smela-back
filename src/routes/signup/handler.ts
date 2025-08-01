import type { Context } from 'hono'

import { setCookie } from 'hono/cookie'
import { StatusCodes } from 'http-status-codes'

import env, { isDevOrTestEnv } from '@/lib/env'

import signUpWithEmail from './signup'

const signupHandler = async (c: Context) => {
  const { firstName, lastName, email, password, role } = await c.req.json()

  const result = await signUpWithEmail({ firstName, lastName, email, password, role })

  // Set cookie for web browser clients
  setCookie(c, env.JWT_COOKIE_NAME, result.token, {
    httpOnly: true,
    secure: !isDevOrTestEnv(), // secure in production
    sameSite: 'lax',
    maxAge: 60 * 60, // 1 hour (matching JWT expiration)
    path: '/',
    ...(env.COOKIE_DOMAIN && !isDevOrTestEnv() && { domain: env.COOKIE_DOMAIN }),
  })

  // Return user and token in response body for CLI/mobile clients
  return c.json(result, StatusCodes.CREATED)
}

export default signupHandler
