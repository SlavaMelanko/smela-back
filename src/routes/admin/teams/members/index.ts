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

teamsMembersRoute.post(
  '/',
  requestValidator('param', teamParamsSchema),
  requestValidator('json', inviteMemberBodySchema),
  createMemberHandler,
)

teamsMembersRoute.post(
  '/:memberId/resend-invite',
  requestValidator('param', resendMemberInviteParamsSchema),
  resendMemberInviteHandler,
)

export default teamsMembersRoute
