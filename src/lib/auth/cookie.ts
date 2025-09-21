import type { Context } from 'hono'

import { deleteCookie, getCookie, setCookie } from 'hono/cookie'

import { isDevOrTestEnv } from '@/lib/env'

export interface Options {
  name: string
  maxAge?: number
  domain?: string
}

export class Cookie {
  constructor(
    private readonly context: Context,
    private readonly options: Options,
  ) {}

  get(): string | undefined {
    return getCookie(this.context, this.options.name)
  }

  set(token: string): void {
    setCookie(this.context, this.options.name, token, {
      httpOnly: true,
      secure: !isDevOrTestEnv(),
      sameSite: 'lax',
      maxAge: this.options.maxAge,
      path: '/',
      ...(this.options.domain && !isDevOrTestEnv() && { domain: this.options.domain }),
    })
  }

  delete(): void {
    deleteCookie(this.context, this.options.name, {
      path: '/',
      ...(this.options.domain && !isDevOrTestEnv() && { domain: this.options.domain }),
    })
  }
}
