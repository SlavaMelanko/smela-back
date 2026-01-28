import { assign, remove } from './mutations'
import { findByUserId } from './queries'

export * from './types'

export const userRoleRepo = {
  assign,
  findByUserId,
  remove,
}
