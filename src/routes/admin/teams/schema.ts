import { z } from 'zod'

import type { ValidatedJsonCtx, ValidatedQueryCtx } from '@/routes/validated-ctx'

import { rules } from '@/routes/rules'

export const getTeamsQuerySchema = z.object({
  search: rules.team.search.optional(),
  ...rules.pagination,
})

export type GetTeamsQuery = z.infer<typeof getTeamsQuerySchema>
export type GetTeamsCtx = ValidatedQueryCtx<GetTeamsQuery>

export const createTeamBodySchema = z.object({
  name: rules.team.name,
  website: rules.team.website,
  description: rules.team.description.optional(),
}).strict()

export type CreateTeamBody = z.infer<typeof createTeamBodySchema>
export type CreateTeamCtx = ValidatedJsonCtx<CreateTeamBody>
