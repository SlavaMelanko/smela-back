import { assign, remove } from './mutations'
import { findByUserId, findInviters } from './queries'

export * from './types'

export const userRoleRepo = {
  assign,
  findByUserId,
  findInviters,
  remove,
}
