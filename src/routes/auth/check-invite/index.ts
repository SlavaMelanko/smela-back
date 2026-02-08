import { Hono } from 'hono'

import type { AppContext } from '@/context'

import { requestValidator } from '@/middleware'

import handler from './handler'
import schema from './schema'

const checkInviteRoute = new Hono<AppContext>()

checkInviteRoute.post(
  '/check-invite',
  requestValidator('json', schema),
  handler,
)

export default checkInviteRoute
