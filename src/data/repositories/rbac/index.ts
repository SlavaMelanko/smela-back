import { setUserPermissions } from './mutations'
import { findRolePermissions, findUserPermissions } from './queries'

export * from './queries'
export * from './types'

export const rbacRepo = {
  findRolePermissions,
  findUserPermissions,
  setUserPermissions,
}
