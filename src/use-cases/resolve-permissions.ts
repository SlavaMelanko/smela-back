import type { Permission, Role } from '@/types'

import { rbacRepo } from '@/data'

export const resolvePermissions = async (userId: string, role: Role): Promise<Permission[]> => {
  const rows = await rbacRepo.findUserPermissions(userId, role)

  return rows.map(row => `${row.action}:${row.resource}` as Permission)
}
