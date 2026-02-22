import type Permission from '@/types/permission'

import { rbacRepo } from '@/data'
import { ALL_PERMISSIONS, Role } from '@/types'

export const resolvePermissions = async (userId: string, role: Role): Promise<Permission[]> => {
  if (role === Role.Owner) {
    return ALL_PERMISSIONS
  }

  const rows = await rbacRepo.findUserPermissions(userId, role)

  return rows.map(row => `${row.action}:${row.resource}` as Permission)
}
