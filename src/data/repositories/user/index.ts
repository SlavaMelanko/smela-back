import { createUser, deleteUser, updateUser } from './mutations'
import { findUserByEmail, findUserById } from './queries'

export * from './types'

export const userRepo = {
  create: createUser,
  delete: deleteUser,
  findByEmail: findUserByEmail,
  findById: findUserById,
  update: updateUser,
}
