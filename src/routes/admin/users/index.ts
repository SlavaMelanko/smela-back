import { Hono } from 'hono'

import type { AppContext } from '@/context'

import { requestValidator } from '@/middleware'

import { adminUserDetailHandler, adminUsersHandler } from './handler'
import { userIdSchema, usersSearchSchema } from './schema'

const adminUsersRoute = new Hono<AppContext>()

adminUsersRoute.get(
  '/users',
  requestValidator('query', usersSearchSchema),
  adminUsersHandler,
)
adminUsersRoute.get(
  '/users/:id',
  requestValidator('param', userIdSchema),
  adminUserDetailHandler,
)

export default adminUsersRoute
