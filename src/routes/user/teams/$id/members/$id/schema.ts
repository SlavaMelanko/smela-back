import { z } from 'zod'

import type { ValidatedParamCtx, ValidatedParamJsonCtx } from '@/routes/validated-ctx'

import { rules } from '@/routes/rules'

export const memberIdParamsSchema = z.object({
  teamId: rules.team.id,
  memberId: rules.user.id,
})

export type MemberIdParams = z.infer<typeof memberIdParamsSchema>
export type MemberIdCtx = ValidatedParamCtx<MemberIdParams>

export const updateTeamMemberBodySchema = z.object({
  membership: z.object({
    position: rules.team.position.nullish(),
  }).optional(),
  member: z.object({
    firstName: rules.user.firstName.optional(),
    lastName: rules.user.lastName.optional(),
  }).optional(),
}).strict()

export type UpdateTeamMemberBody = z.infer<typeof updateTeamMemberBodySchema>
export type UpdateTeamMemberCtx = ValidatedParamJsonCtx<MemberIdParams, UpdateTeamMemberBody>
