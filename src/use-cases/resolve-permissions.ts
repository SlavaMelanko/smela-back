import type { Permission, Role } from '@/types'

import { rbacRepo } from '@/data'

export const resolvePermissions = async (
  userId: string,
  role: Role,
): Promise<Permission[] | undefined> => {
  const rows = await rbacRepo.findUserPermissions(userId, role)

  const permissions = rows.map(row => `${row.action}:${row.resource}` as Permission)

  return permissions.length > 0 ? permissions : undefined
}
