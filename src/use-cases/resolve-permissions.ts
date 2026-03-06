import type { Permission } from '@/types'

import { rbacRepo } from '@/data'

export const resolvePermissionList = async (
  userId: string,
): Promise<Permission[] | undefined> => {
  const rows = await rbacRepo.findUserPermissions(userId)

  // Maps DB rows to "action:resource" strings, e.g.
  // "view:users", "manage:teams" for frontend consumption
  const permissions = rows.map(row => `${row.action}:${row.resource}` as Permission)

  return permissions.length > 0 ? permissions : undefined
}
