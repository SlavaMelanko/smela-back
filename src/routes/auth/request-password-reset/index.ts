import { Hono } from 'hono'

import { requestValidator } from '@/lib/validation'
import { captchaMiddleware } from '@/middleware'

import handler from './handler'
import schema from './schema'

const requestPasswordResetRoute = new Hono()

requestPasswordResetRoute.post(
  '/request-password-reset',
  requestValidator('json', schema),
  captchaMiddleware(),
  handler,
)

export default requestPasswordResetRoute
