import { Hono } from 'hono'

import type { AppContext } from '@/context'

import { requestValidator } from '@/middleware'

import {
  cancelAdminInviteHandler,
  createAdminHandler,
  getAdminDefaultPermissionsHandler,
  getAdminHandler,
  getAdminsHandler,
  resendAdminInviteHandler,
  updateAdminHandler,
} from './handler'
import {
  cancelAdminInviteParamsSchema,
  createAdminBodySchema,
  getAdminParamsSchema,
  getAdminsQuerySchema,
  resendAdminInviteParamsSchema,
  updateAdminBodySchema,
  updateAdminParamsSchema,
} from './schema'

const ownerAdminsRoute = new Hono<AppContext>()

ownerAdminsRoute.get(
  '/admins',
  requestValidator('query', getAdminsQuerySchema),
  getAdminsHandler,
)

ownerAdminsRoute.post(
  '/admins',
  requestValidator('json', createAdminBodySchema),
  createAdminHandler,
)

ownerAdminsRoute.get(
  '/admins/permissions',
  getAdminDefaultPermissionsHandler,
)

ownerAdminsRoute.get(
  '/admins/:adminId',
  requestValidator('param', getAdminParamsSchema),
  getAdminHandler,
)

ownerAdminsRoute.patch(
  '/admins/:adminId',
  requestValidator('param', updateAdminParamsSchema),
  requestValidator('json', updateAdminBodySchema),
  updateAdminHandler,
)

ownerAdminsRoute.post(
  '/admins/:adminId/resend-invite',
  requestValidator('param', resendAdminInviteParamsSchema),
  resendAdminInviteHandler,
)

ownerAdminsRoute.post(
  '/admins/:adminId/cancel-invite',
  requestValidator('param', cancelAdminInviteParamsSchema),
  cancelAdminInviteHandler,
)

export default ownerAdminsRoute
