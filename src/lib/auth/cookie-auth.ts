import type { Context } from 'hono'

import env from '@/lib/env'

import { TOKEN_EXPIRATION_TIME } from './constants'
import { Cookie } from './cookie'

export class AuthCookie extends Cookie {
  constructor(context: Context) {
    super(context, {
      name: env.JWT_COOKIE_NAME,
      maxAge: TOKEN_EXPIRATION_TIME,
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
