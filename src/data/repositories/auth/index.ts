import { createAuth, updateAuth } from './mutations'
import { findByUserId } from './queries'

export * from './types'

export const authRepo = {
  create: createAuth,
  findById: findByUserId,
  update: updateAuth,
}
