import { Hono } from 'hono'

import type { AppContext } from '@/context'

import { requestValidator } from '@/middleware'

import handler from './handler'
import schema from './schema'

const resetPasswordRoute = new Hono<AppContext>()

resetPasswordRoute.post(
  '/reset-password',
  requestValidator('json', schema),
  handler,
)

export default resetPasswordRoute
