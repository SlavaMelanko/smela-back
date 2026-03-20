import type { PaginationParams, SearchParams } from '@/data'
import type { Status } from '@/types'

import { userRepo } from '@/data'
import { AppError, ErrorCode } from '@/errors'
import { isUser, Role } from '@/types'

const normalizeRoles = (params: SearchParams): SearchParams => {
  const filteredRoles = params.roles.filter(isUser)
  const validRoles = filteredRoles.length > 0 ? filteredRoles : [Role.User]

  return {
    ...params,
    roles: validRoles,
  }
}

export const searchUsers = async (params: SearchParams, pagination: PaginationParams) => {
  const result = await userRepo.search(normalizeRoles(params), pagination)

  return {
    data: { users: result.users },
    pagination: result.pagination,
  }
}

export const getUser = async (userId: string) => {
  const user = await userRepo.findByIdExtended(userId)

  if (!user || !isUser(user.role)) {
    throw new AppError(ErrorCode.NotFound, 'User not found')
  }

  return { user }
}

export interface UpdateUserInput {
  firstName?: string
  lastName?: string
  status?: Status
}

export const updateUser = async (userId: string, updates: UpdateUserInput) => {
  const user = await userRepo.findById(userId)

  if (!user || !isUser(user.role)) {
    throw new AppError(ErrorCode.NotFound, 'User not found')
  }

  const updatedUser = await userRepo.update(userId, updates)

  return { user: updatedUser }
}
