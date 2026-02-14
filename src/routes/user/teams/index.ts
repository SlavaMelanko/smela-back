import { Hono } from 'hono'

import type { AppContext } from '@/context'

import { requestValidator, teamAccessMiddleware } from '@/middleware'

import { getTeamHandler, updateTeamHandler } from './handler'
import teamsMembersRoute from './members'
import { teamParamsSchema, updateTeamBodySchema } from './schema'

const teamsRoute = new Hono<AppContext>()

teamsRoute.get(
  '/teams/:teamId',
  requestValidator('param', teamParamsSchema),
  teamAccessMiddleware,
  getTeamHandler,
)

teamsRoute.patch(
  '/teams/:teamId',
  requestValidator('param', teamParamsSchema),
  requestValidator('json', updateTeamBodySchema),
  teamAccessMiddleware,
  updateTeamHandler,
)

teamsRoute.route('/teams/:teamId/members', teamsMembersRoute)

export default teamsRoute
