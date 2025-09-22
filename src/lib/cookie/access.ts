import type { Context } from 'hono'

import env from '@/lib/env'

import { Cookie } from './cookie'

export class AccessCookie extends Cookie {
  constructor(context: Context) {
    super(context, {
      name: env.COOKIE_NAME,
      maxAge: env.COOKIE_EXPIRATION,
      domain: env.COOKIE_DOMAIN,
    })
  }
}

export const getAccessCookie = (c: Context): string | undefined => {
  return new AccessCookie(c).get()
}

export const setAccessCookie = (c: Context, token: string): void => {
  new AccessCookie(c).set(token)
}

export const deleteAccessCookie = (c: Context): void => {
  new AccessCookie(c).delete()
}
