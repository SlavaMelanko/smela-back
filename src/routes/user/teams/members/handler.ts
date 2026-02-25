import type { Handler } from 'hono'

import type { AppContext } from '@/context'

import { HttpStatus } from '@/net/http'
import { getMemberDefaultPermissions } from '@/types'
import {
  cancelMemberInvite,
  getTeamMember,
  getTeamMembers,
  inviteMember,
  resendMemberInvite,
  updateTeamMember,
} from '@/use-cases/user'

import type {
  CancelMemberInviteCtx,
  InviteMemberCtx,
  ResendMemberInviteCtx,
  TeamMemberParamsCtx,
  TeamMembersParamsCtx,
  UpdateTeamMemberCtx,
} from './schema'

export const getMemberDefaultPermissionsHandler: Handler<AppContext> = (c) => {
  return c.json({ permissions: getMemberDefaultPermissions() }, HttpStatus.OK)
}

export const getTeamMembersHandler = async (c: TeamMembersParamsCtx) => {
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

export const getTeamMemberHandler = async (c: TeamMemberParamsCtx) => {
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

export const resendMemberInviteHandler = async (c: ResendMemberInviteCtx) => {
  const { teamId, memberId } = c.req.valid('param')
  const { id: inviterId } = c.get('user')

  const result = await resendMemberInvite(teamId, memberId, inviterId)

  return c.json(result, HttpStatus.OK)
}

export const cancelMemberInviteHandler = async (c: CancelMemberInviteCtx) => {
  const { teamId, memberId } = c.req.valid('param')

  const result = await cancelMemberInvite(teamId, memberId)

  return c.json(result, HttpStatus.OK)
}
