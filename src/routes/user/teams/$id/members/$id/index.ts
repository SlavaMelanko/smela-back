import { Hono } from 'hono'

import type { AppContext } from '@/context'

import { requestValidator, teamAccessMiddleware } from '@/middleware'

import {
  cancelMemberInviteHandler,
  getTeamMemberHandler,
  removeTeamMemberHandler,
  resendMemberInviteHandler,
  updateTeamMemberHandler,
} from './handler'
import { memberIdParamsSchema, updateTeamMemberBodySchema } from './schema'

export const teamsMemberByIdRoute = new Hono<AppContext>()

teamsMemberByIdRoute.get(
  '/',
  requestValidator('param', memberIdParamsSchema),
  teamAccessMiddleware,
  getTeamMemberHandler,
)

teamsMemberByIdRoute.patch(
  '/',
  requestValidator('param', memberIdParamsSchema),
  requestValidator('json', updateTeamMemberBodySchema),
  teamAccessMiddleware,
  updateTeamMemberHandler,
)

teamsMemberByIdRoute.delete(
  '/',
  requestValidator('param', memberIdParamsSchema),
  teamAccessMiddleware,
  removeTeamMemberHandler,
)

teamsMemberByIdRoute.post(
  '/resend-invite',
  requestValidator('param', memberIdParamsSchema),
  teamAccessMiddleware,
  resendMemberInviteHandler,
)

teamsMemberByIdRoute.post(
  '/cancel-invite',
  requestValidator('param', memberIdParamsSchema),
  teamAccessMiddleware,
  cancelMemberInviteHandler,
)
