import { Hono } from 'hono'

import type { AppContext } from '@/context'

import { requestValidator } from '@/middleware'

import {
  cancelAdminInviteHandler,
  getAdminHandler,
  resendAdminInviteHandler,
  updateAdminHandler,
} from './handler'
import { ownerAdminPermissionsRoute } from './permissions'
import { adminIdParamsSchema, updateAdminBodySchema } from './schema'

export const ownerAdminByIdRoute = new Hono<AppContext>()

ownerAdminByIdRoute.get(
  '/',
  requestValidator('param', adminIdParamsSchema),
  getAdminHandler,
)

ownerAdminByIdRoute.patch(
  '/',
  requestValidator('param', adminIdParamsSchema),
  requestValidator('json', updateAdminBodySchema),
  updateAdminHandler,
)

ownerAdminByIdRoute.post(
  '/resend-invite',
  requestValidator('param', adminIdParamsSchema),
  resendAdminInviteHandler,
)

ownerAdminByIdRoute.post(
  '/cancel-invite',
  requestValidator('param', adminIdParamsSchema),
  cancelAdminInviteHandler,
)

ownerAdminByIdRoute.route('/permissions', ownerAdminPermissionsRoute)
