import { Hono } from 'hono'

import { requestValidator } from '@/lib/validation'
import { captchaMiddleware } from '@/middleware'

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
