import { createUser, findUserByEmail, findUserById, incrementTokenVersion, updateUser } from './queries'

export * from './types'

export const userRepo = {
  create: createUser,
  findByEmail: findUserByEmail,
  findById: findUserById,
  incrementTokenVersion,
  update: updateUser,
}
