import { Hono } from 'hono'

import type { AppContext } from '@/context'

import { requestValidator } from '@/middleware'

import {
  createAdminHandler,
  getAdminHandler,
  getAdminsHandler,
  resendAdminInviteHandler,
} from './handler'
import {
  createAdminBodySchema,
  getAdminParamsSchema,
  getAdminsQuerySchema,
  resendAdminInviteParamsSchema,
} from './schema'

const ownerAdminsRoute = new Hono<AppContext>()

// /admins
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

// /admins/:adminId
ownerAdminsRoute.get(
  '/admins/:adminId',
  requestValidator('param', getAdminParamsSchema),
  getAdminHandler,
)

// /admins/:adminId/resend-invite
ownerAdminsRoute.post(
  '/admins/:adminId/resend-invite',
  requestValidator('param', resendAdminInviteParamsSchema),
  resendAdminInviteHandler,
)

export default ownerAdminsRoute
