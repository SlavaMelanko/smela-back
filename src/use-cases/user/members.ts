import { companyRepo } from '@/data'
import { AppError, ErrorCode } from '@/errors'

export const getTeamMembers = async (teamId: string, userId: string) => {
  const membership = await companyRepo.findUserCompany(userId, teamId)

  if (!membership) {
    throw new AppError(ErrorCode.Forbidden, 'Not authorized to access this team')
  }

  const members = await companyRepo.findMembers(teamId)

  return { members }
}

export const getTeamMember = async (
  teamId: string,
  memberId: string,
  userId: string,
) => {
  const membership = await companyRepo.findUserCompany(userId, teamId)

  if (!membership) {
    throw new AppError(ErrorCode.Forbidden, 'Not authorized to access this team')
  }

  const member = await companyRepo.findMember(teamId, memberId)

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
  const membership = await companyRepo.findUserCompany(userId, teamId)

  if (!membership) {
    throw new AppError(ErrorCode.Forbidden, 'Not authorized to access this team')
  }

  const existing = await companyRepo.findMember(teamId, memberId)

  if (!existing) {
    throw new AppError(ErrorCode.NotFound, 'Member not found')
  }

  await companyRepo.updateMember(memberId, teamId, params)

  const member = await companyRepo.findMember(teamId, memberId)

  return { member }
}
