export * from './types'

import { createAuth, findByUserId } from './queries'

export const authRepo = {
  create: createAuth,
  findById: findByUserId,
}
