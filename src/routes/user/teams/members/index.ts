import { Hono } from 'hono'

import type { AppContext } from '@/context'

import { requestValidator } from '@/middleware'

import {
  createMemberHandler,
  getTeamMemberHandler,
  getTeamMembersHandler,
  resendMemberInviteHandler,
  updateTeamMemberHandler,
} from './handler'
import {
  createMemberParamsSchema,
  inviteMemberBodySchema,
  resendMemberInviteParamsSchema,
  teamMemberParamsSchema,
  teamMembersParamsSchema,
  updateTeamMemberBodySchema,
} from './schema'

const teamsMembersRoute = new Hono<AppContext>()

// /teams/:teamId/members
teamsMembersRoute.get(
  '/teams/:teamId/members',
  requestValidator('param', teamMembersParamsSchema),
  getTeamMembersHandler,
)

teamsMembersRoute.post(
  '/teams/:teamId/members',
  requestValidator('param', createMemberParamsSchema),
  requestValidator('json', inviteMemberBodySchema),
  createMemberHandler,
)

// /teams/:teamId/members/:memberId
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

// /teams/:teamId/members/:memberId/resend-invite
teamsMembersRoute.post(
  '/teams/:teamId/members/:memberId/resend-invite',
  requestValidator('param', resendMemberInviteParamsSchema),
  resendMemberInviteHandler,
)

export default teamsMembersRoute
