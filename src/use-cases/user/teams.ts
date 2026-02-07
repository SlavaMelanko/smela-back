import type { CompanySearchParams, PaginationParams } from '@/data'

import { companyRepo } from '@/data'
import { AppError, ErrorCode } from '@/errors'

export const getTeams = async (
  params: CompanySearchParams,
  pagination: PaginationParams,
) => {
  return companyRepo.search(params, pagination)
}

export const getTeam = async (teamId: string, userId?: string) => {
  const team = await companyRepo.find(teamId)

  if (!team) {
    throw new AppError(ErrorCode.NotFound, 'Team not found')
  }

  // If userId provided, verify membership (user-level access)
  if (userId) {
    const membership = await companyRepo.findUserCompany(userId, teamId)

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
  const existing = await companyRepo.findByName(params.name)

  if (existing) {
    throw new AppError(ErrorCode.Conflict, 'Team with this name already exists')
  }

  const team = await companyRepo.create(params)

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
  const existing = await companyRepo.findById(teamId)

  if (!existing) {
    throw new AppError(ErrorCode.NotFound, 'Team not found')
  }

  // If userId provided, verify membership (user-level access)
  if (userId) {
    const membership = await companyRepo.findUserCompany(userId, teamId)

    if (!membership) {
      throw new AppError(ErrorCode.Forbidden, 'Not authorized to update this team')
    }
  }

  if (params.name && params.name !== existing.name) {
    const nameConflict = await companyRepo.findByName(params.name)

    if (nameConflict) {
      throw new AppError(ErrorCode.Conflict, 'Team with this name already exists')
    }
  }

  const team = await companyRepo.update(teamId, params)

  return { team }
}
