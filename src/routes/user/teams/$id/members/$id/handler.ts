import { HttpStatus } from '@/net/http'
import {
  cancelMemberInvite,
  getTeamMember,
  removeTeamMember,
  resendMemberInvite,
  updateTeamMember,
} from '@/use-cases/user'

import type { MemberIdCtx, UpdateTeamMemberCtx } from './schema'

export const getTeamMemberHandler = async (c: MemberIdCtx) => {
  const { teamId, memberId } = c.req.valid('param')

  const result = await getTeamMember(teamId, memberId)

  return c.json(result, HttpStatus.OK)
}

export const updateTeamMemberHandler = async (c: UpdateTeamMemberCtx) => {
  const { teamId, memberId } = c.req.valid('param')
  const body = c.req.valid('json')

  const result = await updateTeamMember(teamId, memberId, body)

  return c.json(result, HttpStatus.OK)
}

export const resendMemberInviteHandler = async (c: MemberIdCtx) => {
  const { teamId, memberId } = c.req.valid('param')
  const { id: inviterId } = c.get('user')

  const result = await resendMemberInvite(teamId, memberId, inviterId)

  return c.json(result, HttpStatus.OK)
}

export const removeTeamMemberHandler = async (c: MemberIdCtx) => {
  const { teamId, memberId } = c.req.valid('param')

  const result = await removeTeamMember(teamId, memberId)

  return c.json(result, HttpStatus.OK)
}

export const cancelMemberInviteHandler = async (c: MemberIdCtx) => {
  const { teamId, memberId } = c.req.valid('param')

  const result = await cancelMemberInvite(teamId, memberId)

  return c.json(result, HttpStatus.OK)
}
