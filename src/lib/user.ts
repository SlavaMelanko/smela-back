import type { NormalizedUser, User } from '@/data'

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
