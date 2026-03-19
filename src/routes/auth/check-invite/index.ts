import { Hono } from 'hono'

import type { AppContext } from '@/context'

import { requestValidator } from '@/middleware'

import { checkInviteHandler } from './handler'
import { checkInviteQuerySchema } from './schema'

export const checkInviteRoute = new Hono<AppContext>()

checkInviteRoute.get(
  '/check-invite',
  requestValidator('query', checkInviteQuerySchema),
  checkInviteHandler,
)
