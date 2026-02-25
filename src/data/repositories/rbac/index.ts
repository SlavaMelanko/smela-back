import { assignRole, setUserPermissions } from './mutations'
import { findInviters, findRole, findUserPermissions } from './queries'

export * from './types'

export const rbacRepo = {
  assignRole,
  findInviters,
  findRole,
  findUserPermissions,
  setUserPermissions,
}
