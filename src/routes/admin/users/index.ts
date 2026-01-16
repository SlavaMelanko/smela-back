import { Hono } from 'hono'

import type { AppContext } from '@/context'

import { requestValidator } from '@/middleware'

import { getUserHandler, getUsersHandler } from './handler'
import { getUserParamsSchema, getUsersQuerySchema } from './schema'

const adminUsersRoute = new Hono<AppContext>()

adminUsersRoute.get(
  '/users',
  requestValidator('query', getUsersQuerySchema),
  getUsersHandler,
)
adminUsersRoute.get(
  '/users/:id',
  requestValidator('param', getUserParamsSchema),
  getUserHandler,
)

export default adminUsersRoute
