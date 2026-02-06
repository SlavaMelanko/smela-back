import { Hono } from 'hono'

import type { AppContext } from '@/context'

import { requestValidator } from '@/middleware'

import {
  createInvitationHandler,
  getAdminHandler,
  getAdminsHandler,
  resendInvitationHandler,
} from './handler'
import {
  createInvitationBodySchema,
  getAdminParamsSchema,
  getAdminsQuerySchema,
  resendInvitationParamsSchema,
} from './schema'

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
  '/admins/invitations',
  requestValidator('json', createInvitationBodySchema),
  createInvitationHandler,
)
ownerAdminsRoute.post(
  '/admins/invitations/:adminId/resend',
  requestValidator('param', resendInvitationParamsSchema),
  resendInvitationHandler,
)

export default ownerAdminsRoute
