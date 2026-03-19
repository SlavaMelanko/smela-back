import { Hono } from 'hono'

import type { AppContext } from '@/context'

import { captchaMiddleware, requestValidator } from '@/middleware'

import { loginHandler } from './handler'
import { loginSchema as schema } from './schema'

export const loginRoute = new Hono<AppContext>()

loginRoute.post(
  '/login',
  requestValidator('json', schema),
  captchaMiddleware(),
  loginHandler,
)
