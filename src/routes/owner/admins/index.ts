import { Hono } from 'hono'

import type { AppContext } from '@/context'

import { requestValidator } from '@/middleware'

import { ownerAdminByIdRoute } from './$id'
import {
  createAdminHandler,
  getAdminDefaultPermissionsHandler,
  getAdminsHandler,
} from './handler'
import { createAdminBodySchema, getAdminsQuerySchema } from './schema'

export const ownerAdminsRoute = new Hono<AppContext>()

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
  '/admins/default-permissions',
  getAdminDefaultPermissionsHandler,
)

ownerAdminsRoute.route('/admins/:adminId', ownerAdminByIdRoute)
