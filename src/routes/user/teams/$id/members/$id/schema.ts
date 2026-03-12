import { z } from 'zod'

import type { ValidatedParamCtx, ValidatedParamJsonCtx } from '@/routes/@shared'

import { requestValidationRules as rules } from '@/routes/@shared'

export const memberIdParamsSchema = z.object({
  teamId: rules.data.id,
  memberId: rules.data.id,
})

export type MemberIdParams = z.infer<typeof memberIdParamsSchema>
export type MemberIdCtx = ValidatedParamCtx<MemberIdParams>

export const updateTeamMemberBodySchema = z.object({
  membership: z.object({
    position: rules.team.position.nullish(),
  }).optional(),
  member: z.object({
    firstName: rules.data.firstName.optional(),
    lastName: rules.data.lastName.optional(),
  }).optional(),
})

export type UpdateTeamMemberBody = z.infer<typeof updateTeamMemberBodySchema>
export type UpdateTeamMemberCtx = ValidatedParamJsonCtx<MemberIdParams, UpdateTeamMemberBody>
