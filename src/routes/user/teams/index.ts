import { Hono } from 'hono'

import type { AppContext } from '@/context'

import { requestValidator } from '@/middleware'

import { getTeamHandler, updateTeamHandler } from './handler'
import teamsInvitesRoute from './invites'
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

teamsRoute.route('/', teamsInvitesRoute)

teamsRoute.route('/', teamsMembersRoute)

export default teamsRoute
