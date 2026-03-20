import { Hono } from 'hono'

import type { AppContext } from '@/context'

import { requestValidator } from '@/middleware'

import { acceptInviteHandler } from './handler'
import { acceptInviteBodySchema } from './schema'

export const acceptInviteRoute = new Hono<AppContext>()

acceptInviteRoute.post(
  '/accept-invite',
  requestValidator('json', acceptInviteBodySchema),
  acceptInviteHandler,
)
