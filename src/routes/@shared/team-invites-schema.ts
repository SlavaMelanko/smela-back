import { z } from 'zod'

import type { ValidatedParamCtx, ValidatedParamJsonCtx } from './handler'

import { dataRules } from './data-rules'
import { permissionsSchema } from './permissions-schema'
import { teamRules } from './team-rules'

export const teamParamsSchema = z.object({
  teamId: dataRules.id,
})

export const inviteMemberBodySchema = z.object({
  firstName: dataRules.firstName,
  lastName: dataRules.lastName.optional(),
  email: dataRules.email,
  position: teamRules.position.optional(),
  permissions: permissionsSchema,
})

export type TeamParams = z.infer<typeof teamParamsSchema>
export type InviteMemberBody = z.infer<typeof inviteMemberBodySchema>
export type InviteMemberCtx = ValidatedParamJsonCtx<TeamParams, InviteMemberBody>

export const resendMemberInviteParamsSchema = z.object({
  teamId: dataRules.id,
  memberId: dataRules.id,
})

export type ResendMemberInviteParams = z.infer<typeof resendMemberInviteParamsSchema>
export type ResendMemberInviteCtx = ValidatedParamCtx<ResendMemberInviteParams>

export const cancelMemberInviteParamsSchema = z.object({
  teamId: dataRules.id,
  memberId: dataRules.id,
})

export type CancelMemberInviteParams = z.infer<typeof cancelMemberInviteParamsSchema>
export type CancelMemberInviteCtx = ValidatedParamCtx<CancelMemberInviteParams>
