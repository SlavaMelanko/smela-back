import { z } from 'zod'

import type { ValidatedParamCtx, ValidatedParamJsonCtx } from '../../../@shared'

import { requestValidationRules as rules } from '../../../@shared'

// /teams/:teamId/members
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

// /teams/:teamId/members/:memberId
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

// /teams/:teamId/members/:memberId/resend-invite
export {
  type ResendMemberInviteCtx,
  resendMemberInviteParamsSchema,
} from '../../../@shared'
