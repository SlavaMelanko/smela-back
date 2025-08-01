import type { Context } from 'hono'

import { setCookie } from 'hono/cookie'
import { StatusCodes } from 'http-status-codes'

import env, { isDevOrTestEnv } from '@/lib/env'

import logInWithEmail from './login'

const loginHandler = async (c: Context) => {
  const { email, password } = await c.req.json()

  const token = await logInWithEmail({ email, password })

  // Set cookie for web browser clients
  setCookie(c, env.JWT_COOKIE_NAME, token, {
    httpOnly: true,
    secure: !isDevOrTestEnv(), // secure in production
    sameSite: 'lax',
    maxAge: 60 * 60, // 1 hour (matching JWT expiration)
    path: '/',
    ...(env.COOKIE_DOMAIN && !isDevOrTestEnv() && { domain: env.COOKIE_DOMAIN }),
  })

  // Return token in response body for CLI/mobile clients
  return c.json({ token }, StatusCodes.OK)
}

export default loginHandler
