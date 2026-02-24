import type { UpdateUserInput } from '@/data'

import { teamRepo, userRepo } from '@/data'
import { AppError, ErrorCode } from '@/errors'

import { resolvePermissions } from '../resolve-permissions'

const prepareValidUpdates = (updates: UpdateUserInput): UpdateUserInput => {
  return Object.fromEntries(
    Object.entries(updates).filter(([_, v]) => v !== undefined),
  ) as UpdateUserInput
}

export const getUser = async (userId: string) => {
  const [user, team] = await Promise.all([
    userRepo.findById(userId),
    teamRepo.findUserTeam(userId),
  ])

  if (!user) {
    // This represents a data inconsistency - user has valid JWT,
    // But doesn't exist in DB
    throw new AppError(ErrorCode.InternalError)
  }

  const permissions = await resolvePermissions(userId, user.role, !!team)

  return { user, team, permissions }
}

export const updateUser = async (userId: string, updates: UpdateUserInput) => {
  const validUpdates = prepareValidUpdates(updates)

  if (Object.keys(validUpdates).length === 0) {
    return getUser(userId)
  }

  const [user, team] = await Promise.all([
    userRepo.update(userId, {
      ...validUpdates,
      updatedAt: new Date(),
    }),
    teamRepo.findUserTeam(userId),
  ])

  const permissions = await resolvePermissions(userId, user.role, !!team)

  return { user, team, permissions }
}
