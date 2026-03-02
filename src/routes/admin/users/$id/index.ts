import { Hono } from 'hono'

import type { AppContext } from '@/context'

import { requestValidator } from '@/middleware'

import { getUserHandler, updateUserHandler } from './handler'
import { updateUserBodySchema, userIdParamsSchema } from './schema'

export const adminUserByIdRoute = new Hono<AppContext>()

adminUserByIdRoute.get(
  '/',
  requestValidator('param', userIdParamsSchema),
  getUserHandler,
)

adminUserByIdRoute.patch(
  '/',
  requestValidator('param', userIdParamsSchema),
  requestValidator('json', updateUserBodySchema),
  updateUserHandler,
)
