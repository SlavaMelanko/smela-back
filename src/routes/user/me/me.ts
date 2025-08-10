import type { UpdateUserInput } from '@/repositories/user/types'

import { AppError, ErrorCode } from '@/lib/catch'
import { userRepo } from '@/repositories'

const prepareValidUpdates = (updates: UpdateUserInput): UpdateUserInput => {
  const validUpdates: UpdateUserInput = {
    ...(updates.firstName && { firstName: updates.firstName.trim() }),
    ...(updates.lastName && { lastName: updates.lastName.trim() }),
  }

  return validUpdates
}

const getUser = async (userId: number) => {
  const user = await userRepo.findById(userId)

  if (!user) {
    // This represents a data inconsistency - user has valid JWT,
    // but doesn't exist in DB.
    throw new AppError(ErrorCode.InternalError)
  }

  return user
}

const updateUser = async (userId: number, updates: UpdateUserInput) => {
  const validUpdates = prepareValidUpdates(updates)

  if (Object.keys(validUpdates).length === 0) {
    return getUser(userId)
  }

  const updatedUser = await userRepo.update(userId, {
    ...validUpdates,
    updatedAt: new Date(),
  })

  if (!updatedUser) {
    throw new AppError(ErrorCode.InternalError, 'Failed to update user.')
  }

  return updatedUser
}

export { getUser, updateUser }
