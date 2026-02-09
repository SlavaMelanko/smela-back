import { Hono } from 'hono'

import type { AppContext } from '@/context'

import { requestValidator } from '@/middleware'

import { getAdminHandler, getAdminsHandler } from './handler'
import { getAdminParamsSchema, getAdminsQuerySchema } from './schema'

const ownerAdminsRoute = new Hono<AppContext>()

ownerAdminsRoute.get(
  '/admins',
  requestValidator('query', getAdminsQuerySchema),
  getAdminsHandler,
)

ownerAdminsRoute.get(
  '/admins/:adminId',
  requestValidator('param', getAdminParamsSchema),
  getAdminHandler,
)

export default ownerAdminsRoute
