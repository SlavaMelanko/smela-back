import { Hono } from 'hono'

import type { AppContext } from '@/context'

import { requestValidator } from '@/middleware'

import {
  createTeamHandler,
  getTeamHandler,
  getTeamsHandler,
  updateTeamHandler,
} from './handler'
import teamsInvitesRoute from './invites'
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
adminTeamsRoute.get(
  '/teams/:teamId',
  requestValidator('param', teamParamsSchema),
  getTeamHandler,
)
adminTeamsRoute.post(
  '/teams',
  requestValidator('json', createTeamBodySchema),
  createTeamHandler,
)
adminTeamsRoute.patch(
  '/teams/:teamId',
  requestValidator('param', teamParamsSchema),
  requestValidator('json', updateTeamBodySchema),
  updateTeamHandler,
)

adminTeamsRoute.route('/', teamsInvitesRoute)

export default adminTeamsRoute
