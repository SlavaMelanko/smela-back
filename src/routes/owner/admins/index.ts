import { Hono } from 'hono'

import type { AppContext } from '@/context'

import { requestValidator } from '@/middleware'

import { getAdminHandler, getAdminsHandler, inviteAdminHandler, resendAdminInvitationHandler } from './handler'
import { getAdminParamsSchema, getAdminsQuerySchema, inviteAdminBodySchema, resendAdminInvitationParamsSchema } from './schema'

const ownerAdminsRoute = new Hono<AppContext>()

ownerAdminsRoute.get(
  '/admins',
  requestValidator('query', getAdminsQuerySchema),
  getAdminsHandler,
)
ownerAdminsRoute.get(
  '/admins/:id',
  requestValidator('param', getAdminParamsSchema),
  getAdminHandler,
)
ownerAdminsRoute.post(
  '/admins/invite',
  requestValidator('json', inviteAdminBodySchema),
  inviteAdminHandler,
)
ownerAdminsRoute.post(
  '/admins/:id/resend-invitation',
  requestValidator('param', resendAdminInvitationParamsSchema),
  resendAdminInvitationHandler,
)

export default ownerAdminsRoute
