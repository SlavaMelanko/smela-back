import { Hono } from 'hono'

import type { AppContext } from '@/context'

import { requestValidator } from '@/middleware'

import handler from './handler'
import schema from './schema'

const verifyEmailRoute = new Hono<AppContext>()

verifyEmailRoute.post(
  '/verify-email',
  requestValidator('json', schema),
  handler,
)

export default verifyEmailRoute
