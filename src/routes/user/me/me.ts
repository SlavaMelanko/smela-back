import { AppError, ErrorCode } from '@/lib/catch'
import { userRepo } from '@/repositories'

const getUser = async (userId: number) => {
  const user = await userRepo.findById(userId)

  if (!user) {
    throw new AppError(ErrorCode.NotFound, 'User not found')
  }

  return user
}

const updateUser = async (userId: number, updates: Partial<{ firstName: string, lastName: string }>) => {
  const updatedUser = await userRepo.update(userId, {
    ...updates,
    updatedAt: new Date(),
  })

  if (!updatedUser) {
    throw new AppError(ErrorCode.InternalError, 'Failed to update user.')
  }

  return updatedUser
}

export { getUser, updateUser }
