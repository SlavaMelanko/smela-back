import { Hono } from 'hono'

import type { AppContext } from '@/context'

import { requestValidator, teamAccessMiddleware } from '@/middleware'

import { getTeamHandler, updateTeamHandler } from './handler'
import { teamsMembersRoute } from './members'
import { teamIdParamsSchema, updateTeamBodySchema } from './schema'

export const teamByIdRoute = new Hono<AppContext>()

teamByIdRoute.get(
  '/',
  requestValidator('param', teamIdParamsSchema),
  teamAccessMiddleware,
  getTeamHandler,
)

teamByIdRoute.patch(
  '/',
  requestValidator('param', teamIdParamsSchema),
  requestValidator('json', updateTeamBodySchema),
  teamAccessMiddleware,
  updateTeamHandler,
)

teamByIdRoute.route('/members', teamsMembersRoute)
