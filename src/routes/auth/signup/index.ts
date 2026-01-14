import { Hono } from 'hono'

import type { AppContext } from '@/context'

import { captchaMiddleware, requestValidator } from '@/middleware'

import handler from './handler'
import schema from './schema'

const signupRoute = new Hono<AppContext>()

signupRoute.post(
  '/signup',
  requestValidator('json', schema),
  captchaMiddleware(),
  handler,
)

export default signupRoute
