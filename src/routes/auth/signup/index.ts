import { Hono } from 'hono'

import { requestValidator } from '@/lib/validation'
import { captchaMiddleware } from '@/middleware'

import handler from './handler'
import schema from './schema'

const signupRoute = new Hono()

signupRoute.post(
  '/signup',
  requestValidator('json', schema),
  captchaMiddleware(),
  handler,
)

export default signupRoute
