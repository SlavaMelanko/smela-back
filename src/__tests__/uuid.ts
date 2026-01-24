/**
 * Test UUID factory for generating predictable, readable UUIDs in tests
 *
 * Format: 00000000-0000-4000-a{type}{counter}
 * Uses valid UUID v4 format with readable hex patterns
 */

let counter = 0

// Hex-compatible type codes (readable but valid hex)
const TYPE_CODES = {
  user: 'a0', // user
  admn: 'ad', // admin
  ownr: '0e', // owner
  tokn: 'f0', // token
  test: '00', // generic test
  none: 'ff', // non-existent
} as const

/**
 * Generates a valid UUID v4 format with a type identifier
 *
 * @param type - Entity type identifier
 * @returns Valid UUID string that passes Zod validation
 *
 * @example
 * createTestUuid('user') // 00000000-0000-4000-a0a0-000000000001
 */
export const createTestUuid = (type: keyof typeof TYPE_CODES = 'test'): string => {
  counter++
  const typeCode = TYPE_CODES[type]
  const paddedCounter = counter.toString(16).padStart(12, '0')

  return `00000000-0000-4000-${typeCode}${typeCode}-${paddedCounter}`
}

/**
 * Resets the UUID counter - call in beforeEach for test isolation
 */
export const resetTestUuidCounter = (): void => {
  counter = 0
}

/**
 * Pre-defined UUID constants for common test entities
 * All UUIDs are valid v4 format that passes Zod .uuid() validation
 */
export const testUuids = {
  // Users (a0a0 = user type)
  USER_1: '00000000-0000-4000-a0a0-000000000001',
  USER_2: '00000000-0000-4000-a0a0-000000000002',
  USER_3: '00000000-0000-4000-a0a0-000000000003',

  // Admins (adad = admin type)
  ADMIN_1: '00000000-0000-4000-adad-000000000001',
  ADMIN_2: '00000000-0000-4000-adad-000000000002',

  // Owner (0e0e = owner type)
  OWNER_1: '00000000-0000-4000-8e0e-000000000001',

  // Tokens (f0f0 = token type)
  TOKEN_1: '00000000-0000-4000-b0f0-000000000001',
  TOKEN_2: '00000000-0000-4000-b0f0-000000000002',

  // Companies (c0c0 = company type)
  COMPANY_1: '00000000-0000-4000-c0c0-000000000001',
  COMPANY_2: '00000000-0000-4000-c0c0-000000000002',

  // Non-existent (ffff = none type)
  NON_EXISTENT: '00000000-0000-4000-bfff-000000000000',
} as const
