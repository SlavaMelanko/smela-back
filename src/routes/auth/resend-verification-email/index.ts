import { Hono } from 'hono'

import type { AppContext } from '@/context'

import { captchaMiddleware, requestValidator } from '@/middleware'

import { resendVerificationEmailHandler } from './handler'
import { resendVerificationEmailBodySchema } from './schema'

export const resendVerificationEmailRoute = new Hono<AppContext>()

resendVerificationEmailRoute.post(
  '/resend-verification-email',
  requestValidator('json', resendVerificationEmailBodySchema),
  captchaMiddleware(),
  resendVerificationEmailHandler,
)
