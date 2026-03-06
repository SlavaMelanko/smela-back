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

// Builds a permission matrix keyed by resource, e.g.
// { users: { view: true }, teams: { view: true, manage: true } }
// Suitable for frontend permission grids where resource is the row
// and actions (view, manage) are the columns with switches/checkboxes
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
