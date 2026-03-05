import { teamRepo } from '@/data'
import { AppError, ErrorCode } from '@/errors'

export const getTeam = async (teamId: string) => {
  const team = await teamRepo.find(teamId)

  if (!team) {
    throw new AppError(ErrorCode.NotFound, 'Team not found')
  }

  return { team }
}

export interface UpdateTeamParams {
  name?: string
  website?: string
  description?: string | null
}

export const updateTeam = async (
  teamId: string,
  params: UpdateTeamParams,
) => {
  const existing = await teamRepo.findById(teamId)

  if (!existing) {
    throw new AppError(ErrorCode.NotFound, 'Team not found')
  }

  const team = await teamRepo.update(teamId, params)

  return { team }
}
