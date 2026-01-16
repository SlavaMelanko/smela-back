import { Hono } from 'hono'

import type { AppContext } from '@/context'

import { requestValidator } from '@/middleware'

import { getAdminHandler, getAdminsHandler, inviteAdminHandler } from './handler'
import { getAdminParamsSchema, getAdminsQuerySchema, inviteAdminBodySchema } from './schema'

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

export default ownerAdminsRoute
