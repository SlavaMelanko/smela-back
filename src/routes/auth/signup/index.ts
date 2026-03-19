import { Hono } from 'hono'

import type { AppContext } from '@/context'

import { captchaMiddleware, requestValidator } from '@/middleware'

import { signupHandler } from './handler'
import { signupBodySchema } from './schema'

export const signupRoute = new Hono<AppContext>()

signupRoute.post(
  '/signup',
  requestValidator('json', signupBodySchema),
  captchaMiddleware(),
  signupHandler,
)
