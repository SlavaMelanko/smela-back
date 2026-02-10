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

teamsMembersRoute.get(
  '/',
  requestValidator('param', teamMembersParamsSchema),
  getTeamMembersHandler,
)

teamsMembersRoute.post(
  '/',
  requestValidator('param', createMemberParamsSchema),
  requestValidator('json', inviteMemberBodySchema),
  createMemberHandler,
)

teamsMembersRoute.get(
  '/:memberId',
  requestValidator('param', teamMemberParamsSchema),
  getTeamMemberHandler,
)

teamsMembersRoute.patch(
  '/:memberId',
  requestValidator('param', teamMemberParamsSchema),
  requestValidator('json', updateTeamMemberBodySchema),
  updateTeamMemberHandler,
)

teamsMembersRoute.post(
  '/:memberId/resend-invite',
  requestValidator('param', resendMemberInviteParamsSchema),
  resendMemberInviteHandler,
)

export default teamsMembersRoute
