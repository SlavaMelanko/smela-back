export * from './types'

import { createUser, findUserByEmail, findUserById, updateUser } from './queries'

export const userRepo = {
  create: createUser,
  findByEmail: findUserByEmail,
  findById: findUserById,
  update: updateUser,
}
