import { HttpStatus } from '@/net/http'
import { inviteMember, resendMemberInvite } from '@/use-cases/user'

import type { InviteMemberCtx, ResendMemberInviteCtx } from './schema'

export const inviteMemberHandler = async (c: InviteMemberCtx) => {
  const { teamId } = c.req.valid('param')
  const member = c.req.valid('json')
  const { id: inviterId } = c.get('user')

  const result = await inviteMember(teamId, member, inviterId)

  return c.json(result, HttpStatus.CREATED)
}

export const resendMemberInviteHandler = async (c: ResendMemberInviteCtx) => {
  const { teamId, memberId } = c.req.valid('param')
  const { id: inviterId } = c.get('user')

  const result = await resendMemberInvite(teamId, memberId, inviterId)

  return c.json(result, HttpStatus.OK)
}
