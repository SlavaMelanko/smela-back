import { Hono } from 'hono'

import type { AppContext } from '@/context'

import { requestValidator } from '@/middleware'

import { getTeamMemberHandler, getTeamMembersHandler, updateTeamMemberHandler } from './handler'
import {
  teamMemberParamsSchema,
  teamMembersParamsSchema,
  updateTeamMemberBodySchema,
} from './schema'

const teamsMembersRoute = new Hono<AppContext>()

teamsMembersRoute.get(
  '/teams/:teamId/members',
  requestValidator('param', teamMembersParamsSchema),
  getTeamMembersHandler,
)

teamsMembersRoute.get(
  '/teams/:teamId/members/:memberId',
  requestValidator('param', teamMemberParamsSchema),
  getTeamMemberHandler,
)

teamsMembersRoute.patch(
  '/teams/:teamId/members/:memberId',
  requestValidator('param', teamMemberParamsSchema),
  requestValidator('json', updateTeamMemberBodySchema),
  updateTeamMemberHandler,
)

export default teamsMembersRoute
