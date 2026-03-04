import { createUser, updateUser } from './mutations'
import { findUserByEmail, findUserById, findUserByIdWithTeam, search } from './queries'

export * from './types'

export const userRepo = {
  create: createUser,
  findByEmail: findUserByEmail,
  findById: findUserById,
  findByIdWithTeam: findUserByIdWithTeam,
  search,
  update: updateUser,
}
