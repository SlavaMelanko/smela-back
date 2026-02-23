import { assignRole, setUserPermissions } from './mutations'
import { findInviters, findRole, findRolePermissions, findUserPermissions } from './queries'

export * from './types'

export const rbacRepo = {
  assignRole,
  findInviters,
  findRole,
  findRolePermissions,
  findUserPermissions,
  setUserPermissions,
}
