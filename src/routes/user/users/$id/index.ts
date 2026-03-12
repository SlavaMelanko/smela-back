import { Hono } from 'hono'

import type { AppContext } from '@/context'

import { requestValidator, teamAccessMiddleware } from '@/middleware'

import { updateUserHandler } from './handler'
import { updateUserBodySchema, userIdParamsSchema } from './schema'

export const userByIdRoute = new Hono<AppContext>()

userByIdRoute.patch(
  '/',
  requestValidator('param', userIdParamsSchema),
  requestValidator('json', updateUserBodySchema),
  teamAccessMiddleware,
  updateUserHandler,
)
