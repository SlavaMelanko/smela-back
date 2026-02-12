import { Hono } from 'hono'

import type { AppContext } from '@/context'

import { requestValidator } from '@/middleware'

import { acceptInviteHandler } from './handler'
import schema from './schema'

const acceptInviteRoute = new Hono<AppContext>()

acceptInviteRoute.post(
  '/accept-invite',
  requestValidator('json', schema),
  acceptInviteHandler,
)

export default acceptInviteRoute
