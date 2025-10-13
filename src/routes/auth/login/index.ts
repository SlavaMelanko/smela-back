import { Hono } from 'hono'

import { captchaMiddleware, requestValidator } from '@/middleware'

import handler from './handler'
import schema from './schema'

const loginRoute = new Hono()

loginRoute.post(
  '/login',
  requestValidator('json', schema),
  captchaMiddleware(),
  handler,
)

export default loginRoute
