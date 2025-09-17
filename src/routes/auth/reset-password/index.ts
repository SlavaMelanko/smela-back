import { Hono } from 'hono'

import { requestValidator } from '@/lib/validation'

import handler from './handler'
import schema from './schema'

const resetPasswordRoute = new Hono()

resetPasswordRoute.post(
  '/reset-password',
  requestValidator('json', schema),
  handler,
)

export default resetPasswordRoute
