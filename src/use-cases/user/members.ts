import { teamRepo, userRepo } from '@/data'
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
  membership?: {
    position?: string | null
  }
  member?: {
    firstName?: string
    lastName?: string | null
  }
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

  const updates: Array<Promise<unknown>> = []

  if (params.membership) {
    updates.push(teamRepo.updateMember(memberId, teamId, params.membership))
  }

  if (params.member) {
    updates.push(userRepo.update(memberId, params.member))
  }

  await Promise.all(updates)

  const member = await teamRepo.findMember(teamId, memberId)

  return { member }
}
