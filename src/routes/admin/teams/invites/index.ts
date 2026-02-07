import { Hono } from 'hono'

import type { AppContext } from '@/context'

import { requestValidator } from '@/middleware'

import { inviteMemberHandler, resendMemberInviteHandler } from './handler'
import {
  inviteMemberBodySchema,
  resendMemberInviteParamsSchema,
  teamParamsSchema,
} from './schema'

const teamsInvitesRoute = new Hono<AppContext>()

teamsInvitesRoute.post(
  '/teams/:teamId/invites',
  requestValidator('param', teamParamsSchema),
  requestValidator('json', inviteMemberBodySchema),
  inviteMemberHandler,
)

teamsInvitesRoute.post(
  '/teams/:teamId/invites/:memberId/resend',
  requestValidator('param', resendMemberInviteParamsSchema),
  resendMemberInviteHandler,
)

export default teamsInvitesRoute
