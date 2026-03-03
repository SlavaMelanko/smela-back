import type { PaginationParams, TeamSearchParams } from '@/data'

import { teamRepo } from '@/data'

export interface CreateTeamParams {
  name: string
  website?: string
  description?: string
}

export const getTeams = async (
  params: TeamSearchParams,
  pagination: PaginationParams,
) => {
  return teamRepo.search(params, pagination)
}

export const createTeam = async (params: CreateTeamParams) => {
  const team = await teamRepo.create(params)

  return { team }
}
