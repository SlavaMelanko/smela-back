import { Hono } from 'hono'

import type { AppContext } from '@/context'

import { requestValidator } from '@/middleware'

import { ownerAdminDetailHandler, ownerAdminsHandler } from './handler'
import { adminIdSchema, adminsSearchSchema } from './schema'

const ownerAdminsRoute = new Hono<AppContext>()

ownerAdminsRoute.get(
  '/admins',
  requestValidator('query', adminsSearchSchema),
  ownerAdminsHandler,
)
ownerAdminsRoute.get(
  '/admins/:id',
  requestValidator('param', adminIdSchema),
  ownerAdminDetailHandler,
)

export default ownerAdminsRoute
