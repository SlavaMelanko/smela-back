import { teamRepo } from '@/data'
import { AppError, ErrorCode } from '@/errors'

export const getTeamMembers = async (teamId: string) => {
  const members = await teamRepo.findMembers(teamId)

  return { members }
}

export const getTeamMember = async (
  teamId: string,
  memberId: string,
) => {
  const member = await teamRepo.findMember(teamId, memberId)

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
) => {
  const existing = await teamRepo.findMember(teamId, memberId)

  if (!existing) {
    throw new AppError(ErrorCode.NotFound, 'Member not found')
  }

  const member = await teamRepo.updateMember(memberId, teamId, params)

  return { member }
}
