import { createUser, deleteUser, updateUser } from './mutations'
import { findUserByEmail, findUserById, search } from './queries'

export type {
  SearchParams,
  SearchResult,
} from './queries'

export * from './types'

export const userRepo = {
  create: createUser,
  delete: deleteUser,
  findByEmail: findUserByEmail,
  findById: findUserById,
  search,
  update: updateUser,
}
