import { Hono } from 'hono'

import type { AppContext } from '@/context'

import { requestValidator } from '@/middleware'

import { createInvitationHandler, resendInvitationHandler } from './handler'
import { inviteAdminBodySchema, resendAdminInviteParamsSchema } from './schema'

const adminsInvitesRoute = new Hono<AppContext>()

adminsInvitesRoute.post(
  '/admins/invites',
  requestValidator('json', inviteAdminBodySchema),
  createInvitationHandler,
)

adminsInvitesRoute.post(
  '/admins/invites/:adminId/resend',
  requestValidator('param', resendAdminInviteParamsSchema),
  resendInvitationHandler,
)

export default adminsInvitesRoute
