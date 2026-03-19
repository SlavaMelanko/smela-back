import { z } from 'zod'

import type { ValidatedParamCtx, ValidatedParamJsonCtx } from '@/routes/validated-ctx'

import { rules } from '@/routes/rules'

export const teamIdParamsSchema = z.object({
  teamId: rules.team.id,
})

export type TeamIdParams = z.infer<typeof teamIdParamsSchema>
export type TeamIdCtx = ValidatedParamCtx<TeamIdParams>

export const updateTeamBodySchema = z.object({
  name: rules.team.name.optional(),
  website: rules.team.website.optional(),
  description: rules.team.description.nullish(),
}).strict()

export type UpdateTeamBody = z.infer<typeof updateTeamBodySchema>
export type UpdateTeamCtx = ValidatedParamJsonCtx<TeamIdParams, UpdateTeamBody>
