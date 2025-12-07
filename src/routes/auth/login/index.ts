import { Hono } from 'hono'

import type { AppContext } from '@/context'

import { captchaMiddleware, requestValidator } from '@/middleware'

import handler from './handler'
import schema from './schema'

const loginRoute = new Hono<AppContext>()

loginRoute.post(
  '/login',
  requestValidator('json', schema),
  captchaMiddleware(),
  handler,
)

export default loginRoute
