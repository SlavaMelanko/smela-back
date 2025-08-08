import type { User } from '@/repositories/user/types'

/**
 * Removes sensitive fields from a user object before sending to the client.
 * Currently removes: tokenVersion
 *
 * @param user - The user object from the database
 * @returns The user object without sensitive fields
 */
const normalizeUser = (user: User): Omit<User, 'tokenVersion'> => {
  const { tokenVersion, ...userWithoutSensitiveFields } = user

  return userWithoutSensitiveFields
}

export { normalizeUser }
