import type { UpdateUserInput } from '@/data'

import { userRepo } from '@/data'
import { AppError, ErrorCode } from '@/errors'

const prepareValidUpdates = (updates: UpdateUserInput): UpdateUserInput => {
  return Object.fromEntries(
    Object.entries(updates).filter(([_, v]) => v !== undefined),
  ) as UpdateUserInput
}

export const getUser = async (userId: string) => {
  const user = await userRepo.findById(userId)

  if (!user) {
    // This represents a data inconsistency - user has valid JWT,
    // But doesn't exist in DB
    throw new AppError(ErrorCode.InternalError)
  }

  return { data: { user } }
}

export const updateUser = async (userId: string, updates: UpdateUserInput) => {
  const validUpdates = prepareValidUpdates(updates)

  if (Object.keys(validUpdates).length === 0) {
    return getUser(userId)
  }

  const updatedUser = await userRepo.update(userId, {
    ...validUpdates,
    updatedAt: new Date(),
  })

  return { data: { user: updatedUser } }
}
