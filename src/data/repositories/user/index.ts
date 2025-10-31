import { createUser, updateUser } from './mutations'
import { findUserByEmail, findUserById } from './queries'

export * from './types'

export const userRepo = {
  create: createUser,
  findByEmail: findUserByEmail,
  findById: findUserById,
  update: updateUser,
}
