import type { Permission, Role } from '@/types'

import { rbacRepo } from '@/data'
import Resource from '@/types/resource'
import { isUser } from '@/types/role'

const isTeamScoped = (resource: Resource) =>
  resource === Resource.Users || resource === Resource.Teams

export const resolvePermissions = async (
  userId: string,
  role: Role,
  hasTeam: boolean,
): Promise<Permission[] | undefined> => {
  const rows = await rbacRepo.findUserPermissions(userId, role)

  const isUserWithoutTeam = isUser(role) && !hasTeam

  const permissions = rows
    .filter(row => isUserWithoutTeam ? !isTeamScoped(row.resource) : true)
    .map(row => `${row.action}:${row.resource}` as Permission)

  return permissions.length > 0 ? permissions : undefined
}
