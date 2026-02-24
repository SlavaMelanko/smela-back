import { createUser, updateUser } from './mutations'
import { findUserByEmail, findUserById, search } from './queries'

export * from './types'

export const userRepo = {
  create: createUser,
  findByEmail: findUserByEmail,
  findById: findUserById,
  search,
  update: updateUser,
}
