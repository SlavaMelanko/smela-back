import { Hono } from 'hono'

import type { AppContext } from '@/context'

import { requestValidator } from '@/middleware'

import { getAdminPermissionsHandler, updateAdminPermissionsHandler } from './handler'
import { adminIdParamsSchema, updateAdminPermissionsBodySchema } from './schema'

export const ownerAdminPermissionsRoute = new Hono<AppContext>()

ownerAdminPermissionsRoute.get(
  '/',
  requestValidator('param', adminIdParamsSchema),
  getAdminPermissionsHandler,
)

ownerAdminPermissionsRoute.patch(
  '/',
  requestValidator('param', adminIdParamsSchema),
  requestValidator('json', updateAdminPermissionsBodySchema),
  updateAdminPermissionsHandler,
)
