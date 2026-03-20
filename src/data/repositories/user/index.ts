import { createUser, updateUser } from './mutations'
import { findUserByEmail, findUserById, findUserByIdExtended, search } from './queries'

export * from './types'

export const userRepo = {
  create: createUser,
  findByEmail: findUserByEmail,
  findById: findUserById,
  findByIdExtended: findUserByIdExtended,
  search,
  update: updateUser,
}
