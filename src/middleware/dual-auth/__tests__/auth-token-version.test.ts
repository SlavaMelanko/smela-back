import { beforeEach, describe, expect, it, mock } from 'bun:test'

import { userRepo } from '@/data'
import { AppError, ErrorCode } from '@/lib/catch'
import jwt from '@/lib/jwt'
import { isActive, Role, Status } from '@/types'

describe('Auth Middleware Logic - Token Version Validation', () => {
  const mockUserId = 123
  const mockEmail = 'test@example.com'
  const mockRole = Role.User
  const mockStatus = Status.Verified

  // Simulate the core auth logic from the middleware
  const simulateAuthLogic = async (token: string) => {
    try {
      const payload = await jwt.verify(token)

      if (!isActive(payload.status as Status)) {
        throw new AppError(ErrorCode.Forbidden)
      }

      // Fetch current user to validate token version
      const user = await userRepo.findById(payload.id as number)
      if (!user || user.tokenVersion !== (payload.v as number)) {
        throw new AppError(ErrorCode.Unauthorized)
      }

      return { success: true, user: payload }
    } catch (error) {
      return { success: false, error }
    }
  }

  beforeEach(() => {
    // Reset mocks before each test
  })

  describe('Token Version Validation Logic', () => {
    it('should succeed when token version matches user tokenVersion', async () => {
      const tokenVersion = 3
      const mockUser = { id: mockUserId, tokenVersion, email: mockEmail }

      // Create JWT with current tokenVersion
      const validToken = await jwt.sign(mockUserId, mockEmail, mockRole, mockStatus, tokenVersion)

      // Mock userRepo to return user with matching tokenVersion
      mock.module('@/data', () => ({
        userRepo: {
          findById: mock(() => Promise.resolve(mockUser)),
        },
      }))

      const result = await simulateAuthLogic(validToken)

      expect(result.success).toBe(true)
      expect(result.user).toBeDefined()
      expect(result.user?.v).toBe(tokenVersion)
      expect(userRepo.findById).toHaveBeenCalledWith(mockUserId)
    })

    it('should fail when token version is lower than user tokenVersion', async () => {
      const oldTokenVersion = 2
      const currentTokenVersion = 5

      const mockUser = { id: mockUserId, tokenVersion: currentTokenVersion }

      // Create JWT with old tokenVersion (user has reset password since)
      const outdatedToken = await jwt.sign(mockUserId, mockEmail, mockRole, mockStatus, oldTokenVersion)

      mock.module('@/data', () => ({
        userRepo: {
          findById: mock(() => Promise.resolve(mockUser)),
        },
      }))

      const result = await simulateAuthLogic(outdatedToken)

      expect(result.success).toBe(false)
      expect(result.error).toBeInstanceOf(AppError)
      expect((result.error as AppError).code).toBe(ErrorCode.Unauthorized)
      expect(userRepo.findById).toHaveBeenCalledWith(mockUserId)
    })

    it('should fail when token version is higher than user tokenVersion', async () => {
      const highTokenVersion = 10
      const currentTokenVersion = 3

      const mockUser = { id: mockUserId, tokenVersion: currentTokenVersion }

      // Create JWT with higher tokenVersion (shouldn't happen in practice)
      const invalidToken = await jwt.sign(mockUserId, mockEmail, mockRole, mockStatus, highTokenVersion)

      mock.module('@/data', () => ({
        userRepo: {
          findById: mock(() => Promise.resolve(mockUser)),
        },
      }))

      const result = await simulateAuthLogic(invalidToken)

      expect(result.success).toBe(false)
      expect(result.error).toBeInstanceOf(AppError)
      expect((result.error as AppError).code).toBe(ErrorCode.Unauthorized)
      expect(userRepo.findById).toHaveBeenCalledWith(mockUserId)
    })

    it('should fail when user is not found', async () => {
      const tokenVersion = 3

      // Create valid JWT
      const validToken = await jwt.sign(mockUserId, mockEmail, mockRole, mockStatus, tokenVersion)

      // Mock userRepo to return null (user not found)
      mock.module('@/data', () => ({
        userRepo: {
          findById: mock(() => Promise.resolve(null)),
        },
      }))

      const result = await simulateAuthLogic(validToken)

      expect(result.success).toBe(false)
      expect(result.error).toBeInstanceOf(AppError)
      expect((result.error as AppError).code).toBe(ErrorCode.Unauthorized)
      expect(userRepo.findById).toHaveBeenCalledWith(mockUserId)
    })

    it('should fail when user status is inactive', async () => {
      const tokenVersion = 3
      const mockUser = { id: mockUserId, tokenVersion, status: Status.Suspended }

      // Create JWT with valid tokenVersion but inactive user
      const inactiveToken = await jwt.sign(mockUserId, mockEmail, mockRole, Status.Suspended, tokenVersion)

      mock.module('@/data', () => ({
        userRepo: {
          findById: mock(() => Promise.resolve(mockUser)),
        },
      }))

      const result = await simulateAuthLogic(inactiveToken)

      expect(result.success).toBe(false)
      expect(result.error).toBeInstanceOf(AppError)
      expect((result.error as AppError).code).toBe(ErrorCode.Forbidden)
    })
  })

  describe('Token Version Edge Cases', () => {
    it('should handle tokenVersion 0 correctly', async () => {
      const tokenVersion = 0
      const mockUser = { id: mockUserId, tokenVersion }

      const validToken = await jwt.sign(mockUserId, mockEmail, mockRole, mockStatus, tokenVersion)

      mock.module('@/data', () => ({
        userRepo: {
          findById: mock(() => Promise.resolve(mockUser)),
        },
      }))

      const result = await simulateAuthLogic(validToken)

      expect(result.success).toBe(true)
      expect(userRepo.findById).toHaveBeenCalledWith(mockUserId)
    })

    it('should handle very large tokenVersion numbers', async () => {
      const tokenVersion = 999999999
      const mockUser = { id: mockUserId, tokenVersion }

      const validToken = await jwt.sign(mockUserId, mockEmail, mockRole, mockStatus, tokenVersion)

      mock.module('@/data', () => ({
        userRepo: {
          findById: mock(() => Promise.resolve(mockUser)),
        },
      }))

      const result = await simulateAuthLogic(validToken)

      expect(result.success).toBe(true)
      expect(userRepo.findById).toHaveBeenCalledWith(mockUserId)
    })

    it('should handle database errors gracefully', async () => {
      const tokenVersion = 3

      const validToken = await jwt.sign(mockUserId, mockEmail, mockRole, mockStatus, tokenVersion)

      // Mock userRepo to throw database error
      mock.module('@/data', () => ({
        userRepo: {
          findById: mock(() => Promise.reject(new Error('Database connection failed'))),
        },
      }))

      const result = await simulateAuthLogic(validToken)

      expect(result.success).toBe(false)
      expect(result.error).toBeInstanceOf(Error)
      expect((result.error as Error).message).toBe('Database connection failed')
      expect(userRepo.findById).toHaveBeenCalledWith(mockUserId)
    })
  })

  describe('JWT Verification Errors', () => {
    it('should handle invalid JWT tokens', async () => {
      const invalidToken = 'invalid.jwt.token'

      mock.module('@/data', () => ({
        userRepo: {
          findById: mock(() => Promise.resolve({ id: mockUserId, tokenVersion: 1 })),
        },
      }))

      const result = await simulateAuthLogic(invalidToken)

      expect(result.success).toBe(false)
      expect(userRepo.findById).not.toHaveBeenCalled()
    })
  })

  describe('Real-world Scenarios', () => {
    it('should simulate password reset invalidating existing tokens', async () => {
      const userId = 456
      const email = 'user@example.com'
      const initialTokenVersion = 2
      const newTokenVersion = 3

      // Step 1: User has a valid JWT before password reset
      const oldToken = await jwt.sign(userId, email, mockRole, mockStatus, initialTokenVersion)

      // Step 2: Password reset increments tokenVersion
      const userAfterReset = { id: userId, tokenVersion: newTokenVersion }

      mock.module('@/data', () => ({
        userRepo: {
          findById: mock(() => Promise.resolve(userAfterReset)),
        },
      }))

      // Step 3: Old token should now be rejected
      const oldResult = await simulateAuthLogic(oldToken)

      expect(oldResult.success).toBe(false)
      expect(oldResult.error).toBeInstanceOf(AppError)
      expect((oldResult.error as AppError).code).toBe(ErrorCode.Unauthorized)
      expect(userRepo.findById).toHaveBeenCalledWith(userId)

      // Step 4: New token with updated version should work
      const newToken = await jwt.sign(userId, email, mockRole, mockStatus, newTokenVersion)
      const newResult = await simulateAuthLogic(newToken)

      expect(newResult.success).toBe(true)
    })

    it('should handle multiple password resets', async () => {
      const userId = 789
      const email = 'multiuser@example.com'

      // Simulate multiple password resets
      const tokenVersions = [1, 2, 3, 4, 5]

      for (let i = 0; i < tokenVersions.length; i++) {
        const currentVersion = tokenVersions[i]
        const user = { id: userId, tokenVersion: currentVersion }

        mock.module('@/data', () => ({
          userRepo: {
            findById: mock(() => Promise.resolve(user)),
          },
        }))

        // Current version token should work
        const currentToken = await jwt.sign(userId, email, mockRole, mockStatus, currentVersion)

        const result = await simulateAuthLogic(currentToken)
        expect(result.success).toBe(true)

        // Previous version tokens should fail
        if (i > 0) {
          const oldToken = await jwt.sign(userId, email, mockRole, mockStatus, currentVersion - 1)
          const oldResult = await simulateAuthLogic(oldToken)
          expect(oldResult.success).toBe(false)
          expect((oldResult.error as AppError).code).toBe(ErrorCode.Unauthorized)
        }
      }
    })

    it('should demonstrate complete flow from login to password reset', async () => {
      const userId = 100
      const email = 'flowtest@example.com'
      let currentTokenVersion = 1

      // Step 1: User logs in - gets JWT with tokenVersion 1
      const user = { id: userId, tokenVersion: currentTokenVersion }

      mock.module('@/data', () => ({
        userRepo: {
          findById: mock(() => Promise.resolve(user)),
        },
      }))

      const loginToken = await jwt.sign(userId, email, mockRole, mockStatus, currentTokenVersion)
      const loginResult = await simulateAuthLogic(loginToken)

      expect(loginResult.success).toBe(true)

      // Step 2: User resets password - tokenVersion incremented to 2
      currentTokenVersion = 2
      const userAfterReset = { id: userId, tokenVersion: currentTokenVersion }

      mock.module('@/data', () => ({
        userRepo: {
          findById: mock(() => Promise.resolve(userAfterReset)),
        },
      }))

      // Step 3: Old login token should now fail
      const oldTokenResult = await simulateAuthLogic(loginToken)
      expect(oldTokenResult.success).toBe(false)
      expect((oldTokenResult.error as AppError).code).toBe(ErrorCode.Unauthorized)

      // Step 4: New login with updated tokenVersion should succeed
      const newLoginToken = await jwt.sign(userId, email, mockRole, mockStatus, currentTokenVersion)
      const newLoginResult = await simulateAuthLogic(newLoginToken)

      expect(newLoginResult.success).toBe(true)
    })
  })
})
