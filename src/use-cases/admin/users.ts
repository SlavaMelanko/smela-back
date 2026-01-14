import type { PaginationParams, SearchParams } from '@/data'

import { userRepo } from '@/data'
import AppError from '@/errors/app-error'
import ErrorCode from '@/errors/codes'
import { isUser, Role } from '@/types'

const normalizeRoles = (params: SearchParams): SearchParams => {
  const filteredRoles = params.roles.filter(isUser)
  const validRoles = filteredRoles.length > 0 ? filteredRoles : [Role.User, Role.Enterprise]

  return {
    ...params,
    roles: validRoles,
  }
}

export const searchUsers = async (params: SearchParams, pagination: PaginationParams) => {
  const result = await userRepo.search(normalizeRoles(params), pagination)

  return {
    data: {
      users: result.users,
      pagination: result.pagination,
    },
  }
}

export const getUser = async (userId: number) => {
  const user = await userRepo.findById(userId)

  if (!user) {
    throw new AppError(ErrorCode.NotFound, 'User not found')
  }

  return { data: { user } }
}
