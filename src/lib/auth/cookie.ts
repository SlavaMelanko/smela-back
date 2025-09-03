import type { Context } from 'hono'

import { deleteCookie as honoDeleteCookie, getCookie as honoGetCookie, setCookie } from 'hono/cookie'

import env, { isDevOrTestEnv } from '@/lib/env'

import { TOKEN_EXPIRATION_TIME } from './constants'

/**
 * Gets authentication cookie value.
 * @param c - Hono context
 * @returns JWT token value or undefined
 */
export const getAuthCookie = (c: Context): string | undefined => {
  return honoGetCookie(c, env.JWT_COOKIE_NAME)
}

/**
 * Sets authentication cookie with JWT token.
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

/**
 * Deletes authentication cookie.
 * @param c - Hono context
 */
export const deleteAuthCookie = (c: Context): void => {
  honoDeleteCookie(c, env.JWT_COOKIE_NAME, {
    path: '/',
    ...(env.COOKIE_DOMAIN && !isDevOrTestEnv() && { domain: env.COOKIE_DOMAIN }),
  })
}
