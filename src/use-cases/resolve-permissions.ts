import type { Permission } from '@/types'

import { rbacRepo } from '@/data'

export const resolvePermissionList = async (
  userId: string,
): Promise<Permission[] | undefined> => {
  const rows = await rbacRepo.findUserPermissions(userId)

  const permissions = rows.map(row => `${row.action}:${row.resource}` as Permission)

  return permissions.length > 0 ? permissions : undefined
}
