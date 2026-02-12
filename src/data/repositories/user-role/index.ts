import { assign, remove } from './mutations'
import { findByUserId, findInvites } from './queries'

export * from './types'

export const userRoleRepo = {
  assign,
  findByUserId,
  findInvites,
  remove,
}
