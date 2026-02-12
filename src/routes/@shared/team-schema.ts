import { z } from 'zod'

import type { ValidatedJsonCtx, ValidatedParamCtx, ValidatedParamJsonCtx, ValidatedQueryCtx } from './handler'

import { dataRules } from './data-rules'
import { paginationRules } from './pagination-rules'
import { teamRules } from './team-rules'

export const getTeamsQuerySchema = z.object({
  search: teamRules.search.optional(),
  ...paginationRules,
})

export type GetTeamsQuery = z.infer<typeof getTeamsQuerySchema>
export type GetTeamsCtx = ValidatedQueryCtx<GetTeamsQuery>

export const teamParamsSchema = z.object({
  teamId: dataRules.id,
})

export type TeamParams = z.infer<typeof teamParamsSchema>
export type TeamParamsCtx = ValidatedParamCtx<TeamParams>

export const createTeamBodySchema = z.object({
  name: teamRules.name,
  website: teamRules.website.optional(),
  description: teamRules.description.optional(),
})

export type CreateTeamBody = z.infer<typeof createTeamBodySchema>
export type CreateTeamCtx = ValidatedJsonCtx<CreateTeamBody>

export const updateTeamBodySchema = z.object({
  name: teamRules.name.optional(),
  website: teamRules.website.nullish(),
  description: teamRules.description.nullish(),
})

export type UpdateTeamBody = z.infer<typeof updateTeamBodySchema>
export type UpdateTeamCtx = ValidatedParamJsonCtx<TeamParams, UpdateTeamBody>
