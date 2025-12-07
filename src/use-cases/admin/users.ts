import type { PaginationParams, SearchParams } from '@/data'

import { userRepo } from '@/data'
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
