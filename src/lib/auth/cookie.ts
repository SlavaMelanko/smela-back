import type { Context } from 'hono'

import { setCookie } from 'hono/cookie'

import env, { isDevOrTestEnv } from '@/lib/env'

import { TOKEN_EXPIRATION_TIME } from './constants'

/**
 * Sets authentication cookie with JWT token
 * @param c - Hono context
 * @param token - JWT token to set in cookie
 */
export const setAuthCookie = (c: Context, token: string): void => {
  setCookie(c, env.JWT_COOKIE_NAME, token, {
    httpOnly: true,
    secure: !isDevOrTestEnv(), // secure in production
    sameSite: 'lax',
    maxAge: TOKEN_EXPIRATION_TIME, // Use the constant instead of hardcoded value
    path: '/',
    ...(env.COOKIE_DOMAIN && !isDevOrTestEnv() && { domain: env.COOKIE_DOMAIN }),
  })
}
