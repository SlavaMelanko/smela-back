import { Hono } from 'hono'

import type { AppContext } from '@/context'

import { requestValidator, teamAccessMiddleware } from '@/middleware'

import { teamsMemberByIdRoute } from './$id'
import {
  createMemberHandler,
  getMemberDefaultPermissionsHandler,
  getTeamMembersHandler,
} from './handler'
import { inviteMemberBodySchema, teamIdParamsSchema } from './schema'

export const teamsMembersRoute = new Hono<AppContext>()

teamsMembersRoute.get(
  '/',
  requestValidator('param', teamIdParamsSchema),
  teamAccessMiddleware,
  getTeamMembersHandler,
)

teamsMembersRoute.post(
  '/',
  requestValidator('param', teamIdParamsSchema),
  requestValidator('json', inviteMemberBodySchema),
  teamAccessMiddleware,
  createMemberHandler,
)

teamsMembersRoute.get(
  '/default-permissions',
  requestValidator('param', teamIdParamsSchema),
  teamAccessMiddleware,
  getMemberDefaultPermissionsHandler,
)

teamsMembersRoute.route('/:memberId', teamsMemberByIdRoute)
