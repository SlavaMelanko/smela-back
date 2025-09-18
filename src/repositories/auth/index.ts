import { createAuth, findByUserId, updateAuth } from './queries'

export * from './types'

export const authRepo = {
  create: createAuth,
  findById: findByUserId,
  update: updateAuth,
}
