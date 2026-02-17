import { Hono } from 'hono'

import type { AppContext } from '@/context'

import { requestValidator, teamAccessMiddleware } from '@/middleware'

import {
  cancelMemberInviteHandler,
  createMemberHandler,
  getTeamMemberHandler,
  getTeamMembersHandler,
  resendMemberInviteHandler,
  updateTeamMemberHandler,
} from './handler'
import {
  cancelMemberInviteParamsSchema,
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

teamsMembersRoute.post(
  '/:memberId/cancel-invite',
  requestValidator('param', cancelMemberInviteParamsSchema),
  teamAccessMiddleware,
  cancelMemberInviteHandler,
)

export default teamsMembersRoute
