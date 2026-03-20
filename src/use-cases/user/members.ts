import { db, teamRepo, userRepo } from '@/data'
import { AppError, ErrorCode } from '@/errors'
import { Status } from '@/types'

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

export interface UpdateTeamMemberInput {
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
  input: UpdateTeamMemberInput,
) => {
  const existing = await teamRepo.findMember(teamId, memberId)

  if (!existing) {
    throw new AppError(ErrorCode.NotFound, 'Member not found')
  }

  const updates: Array<Promise<unknown>> = []

  if (input.membership) {
    updates.push(teamRepo.updateMember(memberId, teamId, input.membership))
  }

  if (input.member) {
    updates.push(userRepo.update(memberId, input.member))
  }

  await Promise.all(updates)

  const member = await teamRepo.findMember(teamId, memberId)

  return { member }
}

export const removeTeamMember = async (teamId: string, memberId: string) => {
  const existing = await teamRepo.findMember(teamId, memberId)

  if (!existing) {
    throw new AppError(ErrorCode.NotFound, 'Member not found')
  }

  await db.transaction(async (tx) => {
    await teamRepo.deleteMember(memberId, teamId, tx)
    await userRepo.update(memberId, { status: Status.Archived }, tx)
  })

  return { success: true }
}
