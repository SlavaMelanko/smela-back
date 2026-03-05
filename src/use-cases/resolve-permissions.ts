import type { Permission } from '@/types'

import { rbacRepo } from '@/data'

export const resolvePermissionList = async (
  userId: string,
): Promise<Permission[] | undefined> => {
  const rows = await rbacRepo.findUserPermissions(userId)

  const permissions = rows.map(row => `${row.action}:${row.resource}` as Permission)

  return permissions.length > 0 ? permissions : undefined
}

export const resolvePermissionMap = async (
  userId: string,
): Promise<Record<string, Record<string, boolean>>> => {
  const rows = await rbacRepo.findUserPermissions(userId)

  return rows.reduce<Record<string, Record<string, boolean>>>((acc, row) => {
    acc[row.resource] ??= {}
    acc[row.resource][row.action] = true

    return acc
  }, {})
}
