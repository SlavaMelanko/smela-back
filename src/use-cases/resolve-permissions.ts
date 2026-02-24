import type { Permission, Role } from '@/types'

import { rbacRepo } from '@/data'
import Resource from '@/types/resource'

export const resolvePermissions = async (
  userId: string,
  role: Role,
  hasTeam: boolean,
): Promise<Permission[] | undefined> => {
  const rows = await rbacRepo.findUserPermissions(userId, role)

  const permissions = rows
    .filter(row => hasTeam || (row.resource !== Resource.Users && row.resource !== Resource.Teams))
    .map(row => `${row.action}:${row.resource}` as Permission)

  return permissions.length > 0 ? permissions : undefined
}
