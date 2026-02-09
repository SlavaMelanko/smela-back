import { Hono } from 'hono'

import type { AppContext } from '@/context'

import { requestValidator } from '@/middleware'

import { createInviteHandler, resendInviteHandler } from './handler'
import { inviteAdminBodySchema, resendAdminInviteParamsSchema } from './schema'

const adminsInvitesRoute = new Hono<AppContext>()

adminsInvitesRoute.post(
  '/admins/invites',
  requestValidator('json', inviteAdminBodySchema),
  createInviteHandler,
)

adminsInvitesRoute.post(
  '/admins/invites/:adminId/resend',
  requestValidator('param', resendAdminInviteParamsSchema),
  resendInviteHandler,
)

export default adminsInvitesRoute
