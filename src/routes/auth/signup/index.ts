import { Hono } from 'hono'

import type { AppContext } from '@/context'

import { captchaMiddleware, requestValidator } from '@/middleware'

import { signupHandler } from './handler'
import schema from './schema'

const signupRoute = new Hono<AppContext>()

signupRoute.post(
  '/signup',
  requestValidator('json', schema),
  captchaMiddleware(),
  signupHandler,
)

export default signupRoute
