import { Hono } from 'hono'

import type { AppContext } from '@/context'

import { captchaMiddleware, requestValidator } from '@/middleware'

import handler from './handler'
import schema from './schema'

const requestPasswordResetRoute = new Hono<AppContext>()

requestPasswordResetRoute.post(
  '/request-password-reset',
  requestValidator('json', schema),
  captchaMiddleware(),
  handler,
)

export default requestPasswordResetRoute
