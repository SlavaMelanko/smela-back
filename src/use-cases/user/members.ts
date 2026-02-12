import { teamRepo } from '@/data'
import { AppError, ErrorCode } from '@/errors'

export const getTeamMembers = async (teamId: string, userId: string) => {
  const membership = await teamRepo.findMember(userId, teamId)

  if (!membership) {
    throw new AppError(ErrorCode.Forbidden, 'Not authorized to access this team')
  }

  const members = await teamRepo.findMembers(teamId)

  return { members }
}

export const getTeamMember = async (
  teamId: string,
  memberId: string,
  userId: string,
) => {
  const membership = await teamRepo.findMember(userId, teamId)

  if (!membership) {
    throw new AppError(ErrorCode.Forbidden, 'Not authorized to access this team')
  }

  const member = await teamRepo.findMember(memberId, teamId)

  if (!member) {
    throw new AppError(ErrorCode.NotFound, 'Member not found')
  }

  return { member }
}

export interface UpdateTeamMemberParams {
  position?: string | null
}

export const updateTeamMember = async (
  teamId: string,
  memberId: string,
  params: UpdateTeamMemberParams,
  userId: string,
) => {
  const membership = await teamRepo.findMember(userId, teamId)

  if (!membership) {
    throw new AppError(ErrorCode.Forbidden, 'Not authorized to access this team')
  }

  const existing = await teamRepo.findMember(memberId, teamId)

  if (!existing) {
    throw new AppError(ErrorCode.NotFound, 'Member not found')
  }

  const member = await teamRepo.updateMember(memberId, teamId, params)

  return { member }
}
