import { z } from 'zod'

import type { ValidatedJsonCtx, ValidatedParamCtx, ValidatedParamJsonCtx, ValidatedQueryCtx } from '../validated-ctx'

import { rules } from '../rules'

export const getTeamsQuerySchema = z.object({
  search: rules.team.search.optional(),
  ...rules.pagination,
})

export type GetTeamsQuery = z.infer<typeof getTeamsQuerySchema>
export type GetTeamsCtx = ValidatedQueryCtx<GetTeamsQuery>

export const teamParamsSchema = z.object({
  teamId: rules.user.id,
})

export type TeamParams = z.infer<typeof teamParamsSchema>
export type TeamParamsCtx = ValidatedParamCtx<TeamParams>

export const createTeamBodySchema = z.object({
  name: rules.team.name,
  website: rules.team.website,
  description: rules.team.description.optional(),
})

export type CreateTeamBody = z.infer<typeof createTeamBodySchema>
export type CreateTeamCtx = ValidatedJsonCtx<CreateTeamBody>

export const updateTeamBodySchema = z.object({
  name: rules.team.name.optional(),
  website: rules.team.website.optional(),
  description: rules.team.description.nullish(),
})

export type UpdateTeamBody = z.infer<typeof updateTeamBodySchema>
export type UpdateTeamCtx = ValidatedParamJsonCtx<TeamParams, UpdateTeamBody>
