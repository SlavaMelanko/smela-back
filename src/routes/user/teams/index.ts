import { Hono } from 'hono'

import type { AppContext } from '@/context'

import { requestValidator } from '@/middleware'

import { getTeamHandler, updateTeamHandler } from './handler'
import teamsMembersRoute from './members'
import { teamParamsSchema, updateTeamBodySchema } from './schema'

const teamsRoute = new Hono<AppContext>()

teamsRoute.get(
  '/teams/:teamId',
  requestValidator('param', teamParamsSchema),
  getTeamHandler,
)

teamsRoute.patch(
  '/teams/:teamId',
  requestValidator('param', teamParamsSchema),
  requestValidator('json', updateTeamBodySchema),
  updateTeamHandler,
)

teamsRoute.route('/teams/:teamId/members', teamsMembersRoute)

export default teamsRoute
