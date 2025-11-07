import type { Context } from 'hono'

import { deleteCookie, getCookie, setCookie } from 'hono/cookie'

import env, { isDevOrTestEnv } from '@/env'

const options = ({
  name: 'refresh-token',
  maxAge: env.COOKIE_EXPIRATION,
  domain: env.COOKIE_DOMAIN && !isDevOrTestEnv() ? env.COOKIE_DOMAIN : undefined,
  httpOnly: true,
  secure: !isDevOrTestEnv(),
  sameSite: 'strict' as const,
  path: '/',
})

export const getRefreshCookie = (c: Context): string | undefined => {
  return getCookie(c, options.name)
}

export const setRefreshCookie = (c: Context, token: string): void => {
  setCookie(c, options.name, token, {
    httpOnly: options.httpOnly,
    secure: options.secure,
    sameSite: options.sameSite,
    maxAge: options.maxAge,
    path: options.path,
    ...(options.domain && { domain: options.domain }),
  })
}

export const deleteRefreshCookie = (c: Context): void => {
  deleteCookie(c, options.name, {
    path: options.path,
    ...(options.domain && { domain: options.domain }),
  })
}
