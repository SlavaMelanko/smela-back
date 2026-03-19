import type { PaginationParams, TeamSearchParams } from '@/data'

import { teamRepo } from '@/data'

export const getTeams = async (
  params: TeamSearchParams,
  pagination: PaginationParams,
) => {
  return teamRepo.search(params, pagination)
}

export interface CreateTeamInput {
  name: string
  website: string
  description?: string
}

export const createTeam = async (input: CreateTeamInput) => {
  const team = await teamRepo.create(input)

  return { team }
}
