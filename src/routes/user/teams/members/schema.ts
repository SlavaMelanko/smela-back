import { z } from 'zod'

import type { ValidatedParamCtx, ValidatedParamJsonCtx } from '../../../@shared'

import { requestValidationRules as rules } from '../../../@shared'

export const teamMembersParamsSchema = z.object({
  teamId: rules.data.id,
})

export type TeamMembersParams = z.infer<typeof teamMembersParamsSchema>
export type TeamMembersParamsCtx = ValidatedParamCtx<TeamMembersParams>

export {
  teamInvitesParamsSchema as createMemberParamsSchema,
  inviteMemberBodySchema,
  type InviteMemberCtx,
} from '../../../@shared'

export const teamMemberParamsSchema = z.object({
  teamId: rules.data.id,
  memberId: rules.data.id,
})

export type TeamMemberParams = z.infer<typeof teamMemberParamsSchema>
export type TeamMemberParamsCtx = ValidatedParamCtx<TeamMemberParams>

export const updateTeamMemberBodySchema = z.object({
  position: rules.team.position.nullish(),
})

export type UpdateTeamMemberBody = z.infer<typeof updateTeamMemberBodySchema>
export type UpdateTeamMemberCtx = ValidatedParamJsonCtx<TeamMemberParams, UpdateTeamMemberBody>

export {
  type CancelMemberInviteCtx,
  cancelMemberInviteParamsSchema,
  type ResendMemberInviteCtx,
  resendMemberInviteParamsSchema,
} from '../../../@shared'
