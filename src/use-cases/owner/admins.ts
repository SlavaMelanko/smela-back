import type { PaginationParams, SearchParams } from '@/data'

import { userRepo } from '@/data'
import { AppError, ErrorCode } from '@/errors'
import { Role } from '@/types'

const normalizeRoles = (params: SearchParams): SearchParams => ({
  ...params,
  roles: [Role.Admin],
})

export const searchAdmins = async (params: SearchParams, pagination: PaginationParams) => {
  const result = await userRepo.search(normalizeRoles(params), pagination)

  return {
    data: { users: result.users },
    pagination: result.pagination,
  }
}

export const getAdmin = async (adminId: number) => {
  const user = await userRepo.findById(adminId)

  if (!user || user.role !== Role.Admin) {
    throw new AppError(ErrorCode.NotFound, 'Admin not found')
  }

  return { data: { user } }
}
