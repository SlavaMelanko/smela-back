import type { NormalizedUser, User } from './types'

import { createUser, incrementTokenVersion, updateUser } from './mutations'
import { findUserByEmail, findUserById } from './queries'

export * from './types'

/**
 * Removes sensitive fields from a user object before sending to the client.
 * Currently removes: tokenVersion
 *
 * @param user - The user object from the database
 * @returns The user object without sensitive fields
 */
export const normalizeUser = (user: User): NormalizedUser => {
  const { tokenVersion, ...userWithoutSensitiveFields } = user

  return userWithoutSensitiveFields
}

export const userRepo = {
  create: createUser,
  findByEmail: findUserByEmail,
  findById: findUserById,
  incrementTokenVersion,
  update: updateUser,
}
