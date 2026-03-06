import type { Permission, PermissionMap } from '@/types'

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

// Builds a permission map grouped by resource.
//
// Example:
// {
//   users: { view: true, manage: true },
//   teams: { view: true }
// }
//
// Useful for frontend permission grids where resources are rows
// and actions (view, manage) are toggleable columns.
//
// If a baseline (all-false map) is provided, missing permissions
// will be explicitly set to false:
//
// {
//   users: { view: true, manage: true },
//   teams: { view: true, manage: false }
// }
export const resolvePermissionMap = async (
  userId: string,
  baseline?: PermissionMap,
): Promise<PermissionMap> => {
  const rows = await rbacRepo.findUserPermissions(userId)

  const result: PermissionMap = baseline ? structuredClone(baseline) : {}

  for (const row of rows) {
    const resource = result[row.resource] ?? {}
    resource[row.action] = true
    result[row.resource] = resource
  }

  return result
}
