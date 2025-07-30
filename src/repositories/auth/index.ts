export * from './types'

import { createAuth, findByUserId, updateAuth } from './queries'

export const authRepo = {
  create: createAuth,
  findById: findByUserId,
  update: updateAuth,
}
