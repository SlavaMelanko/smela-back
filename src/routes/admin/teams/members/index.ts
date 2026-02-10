import { Hono } from 'hono'

import type { AppContext } from '@/context'

import { requestValidator } from '@/middleware'

import { createMemberHandler, resendMemberInviteHandler } from './handler'
import {
  inviteMemberBodySchema,
  resendMemberInviteParamsSchema,
  teamParamsSchema,
} from './schema'

const teamsMembersRoute = new Hono<AppContext>()

// /teams/:teamId/members
teamsMembersRoute.post(
  '/teams/:teamId/members',
  requestValidator('param', teamParamsSchema),
  requestValidator('json', inviteMemberBodySchema),
  createMemberHandler,
)

// /teams/:teamId/members/:memberId/resend-invite
teamsMembersRoute.post(
  '/teams/:teamId/members/:memberId/resend-invite',
  requestValidator('param', resendMemberInviteParamsSchema),
  resendMemberInviteHandler,
)

export default teamsMembersRoute
