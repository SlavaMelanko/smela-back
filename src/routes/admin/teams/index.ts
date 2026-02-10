import { Hono } from 'hono'

import type { AppContext } from '@/context'

import { requestValidator } from '@/middleware'

import {
  createTeamHandler,
  getTeamHandler,
  getTeamsHandler,
  updateTeamHandler,
} from './handler'
import teamsMembersRoute from './members'
import {
  createTeamBodySchema,
  getTeamsQuerySchema,
  teamParamsSchema,
  updateTeamBodySchema,
} from './schema'

const adminTeamsRoute = new Hono<AppContext>()

adminTeamsRoute.get(
  '/teams',
  requestValidator('query', getTeamsQuerySchema),
  getTeamsHandler,
)

adminTeamsRoute.post(
  '/teams',
  requestValidator('json', createTeamBodySchema),
  createTeamHandler,
)

adminTeamsRoute.get(
  '/teams/:teamId',
  requestValidator('param', teamParamsSchema),
  getTeamHandler,
)

adminTeamsRoute.patch(
  '/teams/:teamId',
  requestValidator('param', teamParamsSchema),
  requestValidator('json', updateTeamBodySchema),
  updateTeamHandler,
)

adminTeamsRoute.route('/teams/:teamId/members', teamsMembersRoute)

export default adminTeamsRoute
