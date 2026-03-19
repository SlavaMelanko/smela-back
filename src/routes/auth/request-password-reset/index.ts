import { Hono } from 'hono'

import type { AppContext } from '@/context'

import { captchaMiddleware, requestValidator } from '@/middleware'

import { requestPasswordResetHandler } from './handler'
import { requestPasswordResetSchema as schema } from './schema'

export const requestPasswordResetRoute = new Hono<AppContext>()

requestPasswordResetRoute.post(
  '/request-password-reset',
  requestValidator('json', schema),
  captchaMiddleware(),
  requestPasswordResetHandler,
)
