import type { PermissionsInput } from '@/types'

import { rbacRepo, userRepo } from '@/data'
import { AppError, ErrorCode } from '@/errors'
import { Role } from '@/types'
import { getAdminBasePermissions } from '@/types/permission'
import { resolvePermissionMap } from '@/use-cases/resolve-permissions'

export const getAdminPermissions = async (adminId: string) => {
  const admin = await userRepo.findById(adminId)

  if (!admin || admin.role !== Role.Admin) {
    throw new AppError(ErrorCode.NotFound, 'Admin not found')
  }

  const permissions = await resolvePermissionMap(adminId, getAdminBasePermissions())

  return { permissions }
}

export const updateAdminPermissions = async (adminId: string, permissions: PermissionsInput) => {
  const admin = await userRepo.findById(adminId)

  if (!admin || admin.role !== Role.Admin) {
    throw new AppError(ErrorCode.NotFound, 'Admin not found')
  }

  await rbacRepo.setUserPermissions(adminId, permissions)

  const updated = await resolvePermissionMap(adminId, getAdminBasePermissions())

  return { permissions: updated }
}
