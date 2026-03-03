import type { Handler } from 'hono'

import type { AppContext } from '@/context'

import { HttpStatus } from '@/net/http'
import { getMemberDefaultPermissions } from '@/types'
import { getTeamMembers, inviteMember } from '@/use-cases/user'

import type { InviteMemberCtx, TeamIdCtx } from './schema'

export const getMemberDefaultPermissionsHandler: Handler<AppContext> = (c) => {
  return c.json({ permissions: getMemberDefaultPermissions() }, HttpStatus.OK)
}

export const getTeamMembersHandler = async (c: TeamIdCtx) => {
  const { teamId } = c.req.valid('param')

  const result = await getTeamMembers(teamId)

  return c.json(result, HttpStatus.OK)
}

export const createMemberHandler = async (c: InviteMemberCtx) => {
  const { teamId } = c.req.valid('param')
  const member = c.req.valid('json')
  const { id: inviterId } = c.get('user')

  const result = await inviteMember(teamId, member, inviterId)

  return c.json(result, HttpStatus.CREATED)
}
