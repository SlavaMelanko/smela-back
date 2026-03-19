import type { PermissionsInput } from '@/types'

import Action from '@/types/action'
import Resource from '@/types/resource'

import type { ActivePermissionRow } from './types'

export type NormalizedPermissions = Partial<Record<Resource, { view?: boolean, manage: boolean }>>

// Before writing: collapse view + manage → manage only
export const collapsePermissions = (permissions: PermissionsInput): NormalizedPermissions => {
  const result: NormalizedPermissions = { ...permissions }

  for (const resource of Object.values(Resource)) {
    const perms = result[resource]
    if (perms?.[Action.View] === true && perms?.[Action.Manage] === true) {
      result[resource] = { [Action.Manage]: true }
    }
  }

  return result
}

// After reading: expand manage → derive synthetic view rows
export const expandPermissions = (rows: ActivePermissionRow[]): ActivePermissionRow[] => {
  const derived: ActivePermissionRow[] = rows
    .filter(r => r.action === Action.Manage)
    .map(r => ({ action: Action.View, resource: r.resource }))

  return [...rows, ...derived]
}
