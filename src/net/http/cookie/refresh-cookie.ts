import type { Context } from 'hono'

import { deleteCookie, getCookie, setCookie } from 'hono/cookie'

import env, { isDevOrTestEnv } from '@/env'

const getOptions = () => ({
  name: env.COOKIE_NAME,
  maxAge: env.COOKIE_EXPIRATION,
  domain: env.COOKIE_DOMAIN && !isDevOrTestEnv() ? env.COOKIE_DOMAIN : undefined,
  httpOnly: true,
  secure: !isDevOrTestEnv(),
  sameSite: 'strict' as const,
  path: '/',
})

export const getRefreshCookie = (c: Context): string | undefined => {
  const options = getOptions()

  return getCookie(c, options.name)
}

export const setRefreshCookie = (c: Context, token: string): void => {
  const options = getOptions()

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
  const options = getOptions()

  deleteCookie(c, options.name, {
    path: options.path,
    ...(options.domain && { domain: options.domain }),
  })
}
