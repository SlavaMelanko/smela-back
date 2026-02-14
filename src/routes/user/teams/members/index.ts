import { Hono } from 'hono'

import type { AppContext } from '@/context'

import { requestValidator, teamAccessMiddleware } from '@/middleware'

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

teamsMembersRoute.get(
  '/',
  requestValidator('param', teamMembersParamsSchema),
  teamAccessMiddleware,
  getTeamMembersHandler,
)

teamsMembersRoute.post(
  '/',
  requestValidator('param', createMemberParamsSchema),
  requestValidator('json', inviteMemberBodySchema),
  teamAccessMiddleware,
  createMemberHandler,
)

teamsMembersRoute.get(
  '/:memberId',
  requestValidator('param', teamMemberParamsSchema),
  teamAccessMiddleware,
  getTeamMemberHandler,
)

teamsMembersRoute.patch(
  '/:memberId',
  requestValidator('param', teamMemberParamsSchema),
  requestValidator('json', updateTeamMemberBodySchema),
  teamAccessMiddleware,
  updateTeamMemberHandler,
)

teamsMembersRoute.post(
  '/:memberId/resend-invite',
  requestValidator('param', resendMemberInviteParamsSchema),
  teamAccessMiddleware,
  resendMemberInviteHandler,
)

export default teamsMembersRoute
