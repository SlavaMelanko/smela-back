import type { PaginationParams, TeamSearchParams } from '@/data'

import { teamRepo } from '@/data'
import { AppError, ErrorCode } from '@/errors'

export const getTeams = async (
  params: TeamSearchParams,
  pagination: PaginationParams,
) => {
  return teamRepo.search(params, pagination)
}

export const getTeam = async (teamId: string, userId?: string) => {
  const team = await teamRepo.find(teamId)

  if (!team) {
    throw new AppError(ErrorCode.NotFound, 'Team not found')
  }

  // If userId provided, verify membership (user-level access)
  if (userId) {
    const membership = await teamRepo.findMember(userId, teamId)

    if (!membership) {
      throw new AppError(ErrorCode.Forbidden, 'Not authorized to access this team')
    }
  }

  return { team }
}

export interface CreateTeamParams {
  name: string
  website?: string
  description?: string
}

export const createTeam = async (params: CreateTeamParams) => {
  const team = await teamRepo.create(params)

  return { team }
}

export interface UpdateTeamParams {
  name?: string
  website?: string | null
  description?: string | null
}

export const updateTeam = async (
  teamId: string,
  params: UpdateTeamParams,
  userId?: string,
) => {
  const existing = await teamRepo.findById(teamId)

  if (!existing) {
    throw new AppError(ErrorCode.NotFound, 'Team not found')
  }

  // If userId provided, verify membership (user-level access)
  if (userId) {
    const membership = await teamRepo.findMember(userId, teamId)

    if (!membership) {
      throw new AppError(ErrorCode.Forbidden, 'Not authorized to update this team')
    }
  }

  const team = await teamRepo.update(teamId, params)

  return { team }
}
