import { Hono } from 'hono'

import type { AppContext } from '@/context'

import { requestValidator } from '@/middleware'

import { getTeamHandler, updateTeamHandler } from './handler'
import teamsMembersRoute from './members'
import { teamParamsSchema, updateTeamBodySchema } from './schema'

const teamsRoute = new Hono<AppContext>()

// /teams/:teamId
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

// /teams/:teamId/members/*
teamsRoute.route('/', teamsMembersRoute)

export default teamsRoute
