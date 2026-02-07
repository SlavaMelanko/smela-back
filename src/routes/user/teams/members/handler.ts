import { HttpStatus } from '@/net/http'
import { getTeamMember, getTeamMembers, updateTeamMember } from '@/use-cases/user'

import type { TeamMemberParamsCtx, TeamMembersParamsCtx, UpdateTeamMemberCtx } from './schema'

export const getTeamMembersHandler = async (c: TeamMembersParamsCtx) => {
  const { teamId } = c.req.valid('param')
  const { id: userId } = c.get('user')

  const result = await getTeamMembers(teamId, userId)

  return c.json(result, HttpStatus.OK)
}

export const getTeamMemberHandler = async (c: TeamMemberParamsCtx) => {
  const { teamId, memberId } = c.req.valid('param')
  const { id: userId } = c.get('user')

  const result = await getTeamMember(teamId, memberId, userId)

  return c.json(result, HttpStatus.OK)
}

export const updateTeamMemberHandler = async (c: UpdateTeamMemberCtx) => {
  const { teamId, memberId } = c.req.valid('param')
  const body = c.req.valid('json')
  const { id: userId } = c.get('user')

  const result = await updateTeamMember(teamId, memberId, body, userId)

  return c.json(result, HttpStatus.OK)
}
