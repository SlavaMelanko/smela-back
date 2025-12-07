import { Hono } from 'hono'

import type { AppContext } from '@/context'

import { captchaMiddleware, requestValidator } from '@/middleware'

import handler from './handler'
import schema from './schema'

const resendVerificationEmailRoute = new Hono<AppContext>()

resendVerificationEmailRoute.post(
  '/resend-verification-email',
  requestValidator('json', schema),
  captchaMiddleware(),
  handler,
)

export default resendVerificationEmailRoute
