import type { PaginationParams, SearchParams } from '@/data'
import type { Status } from '@/types'

import { rbacRepo, userRepo } from '@/data'
import { AppError, ErrorCode } from '@/errors'
import { Role } from '@/types'

const normalizeRoles = (params: SearchParams): SearchParams => ({
  ...params,
  roles: [Role.Admin],
})

export const getAdmins = async (params: SearchParams, pagination: PaginationParams) => {
  const result = await userRepo.search(normalizeRoles(params), pagination)

  const adminIds = result.users.map(u => u.id)
  const inviters = await rbacRepo.findInviters(adminIds)

  const admins = result.users.map(admin => ({
    ...admin,
    inviter: inviters.get(admin.id),
  }))

  return {
    data: { admins },
    pagination: result.pagination,
  }
}

export const getAdmin = async (adminId: string) => {
  const admin = await userRepo.findByIdExtended(adminId)

  if (!admin || admin.role !== Role.Admin) {
    throw new AppError(ErrorCode.NotFound, 'Admin not found')
  }

  const inviters = await rbacRepo.findInviters([adminId])

  return {
    admin: {
      ...admin,
      inviter: inviters.get(adminId),
    },
  }
}

export interface UpdateAdminInput {
  firstName?: string
  lastName?: string
  status?: Status
}

export const updateAdmin = async (adminId: string, updates: UpdateAdminInput) => {
  const admin = await userRepo.findById(adminId)

  if (!admin || admin.role !== Role.Admin) {
    throw new AppError(ErrorCode.NotFound, 'Admin not found')
  }

  const updatedAdmin = await userRepo.update(adminId, updates)

  return { admin: updatedAdmin }
}
