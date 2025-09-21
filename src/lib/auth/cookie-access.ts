import type { Context } from 'hono'

import env from '@/lib/env'

import { Cookie } from './cookie'

export class AuthCookie extends Cookie {
  constructor(context: Context) {
    super(context, {
      name: env.COOKIE_NAME,
      maxAge: env.COOKIE_EXPIRATION,
      domain: env.COOKIE_DOMAIN,
    })
  }
}

export const getAuthCookie = (c: Context): string | undefined => {
  return new AuthCookie(c).get()
}

export const setAuthCookie = (c: Context, token: string): void => {
  new AuthCookie(c).set(token)
}

export const deleteAuthCookie = (c: Context): void => {
  new AuthCookie(c).delete()
}
