export * from './types'

import { createUser, findUserByEmail } from './queries'

export const userRepo = {
  create: createUser,
  findByEmail: findUserByEmail,
}
