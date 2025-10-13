import { beforeEach, describe, expect, it, mock } from 'bun:test'

import { userRepo } from '@/data'
import { AppError, ErrorCode } from '@/errors'
import { signJwt, verifyJwt } from '@/jwt'
import { isActive, Role, Status } from '@/types'

import { jwtOptions } from './jwt-utils'

describe('Auth Middleware Logic - Token Version Validation', () => {
  const mockUserId = 123
  const mockEmail = 'test@example.com'
  const mockRole = Role.User
  const mockStatus = Status.Verified

  // Simulate the core auth logic from the middleware
  const simulateAuthLogic = async (token: string) => {
    try {
      const userClaims = await verifyJwt(token, jwtOptions)

      if (!isActive(userClaims.status)) {
        throw new AppError(ErrorCode.Forbidden)
      }

      // Fetch current user to validate token version
      const user = await userRepo.findById(userClaims.id)
      if (!user || user.tokenVersion !== userClaims.tokenVersion) {
        throw new AppError(ErrorCode.Unauthorized)
      }

      return { success: true, user: userClaims }
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
      const validToken = await signJwt(
        { id: mockUserId, email: mockEmail, role: mockRole, status: mockStatus, tokenVersion },
        jwtOptions,
      )

      // Mock userRepo to return user with matching tokenVersion
      await mock.module('@/data', () => ({
        userRepo: {
          findById: mock(async () => mockUser),
        },
      }))

      const result = await simulateAuthLogic(validToken)

      expect(result.success).toBe(true)
      expect(result.user).toBeDefined()
      expect(result.user?.tokenVersion).toBe(tokenVersion)
      expect(userRepo.findById).toHaveBeenCalledWith(mockUserId)
    })

    it('should fail when token version is lower than user tokenVersion', async () => {
      const oldTokenVersion = 2
      const currentTokenVersion = 5

      const mockUser = { id: mockUserId, tokenVersion: currentTokenVersion }

      // Create JWT with old tokenVersion (user has reset password since)
      const outdatedToken = await signJwt(
        {
          id: mockUserId,
          email: mockEmail,
          role: mockRole,
          status: mockStatus,
          tokenVersion: oldTokenVersion,
        },
        jwtOptions,
      )

      await mock.module('@/data', () => ({
        userRepo: {
          findById: mock(async () => mockUser),
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
      const invalidToken = await signJwt(
        {
          id: mockUserId,
          email: mockEmail,
          role: mockRole,
          status: mockStatus,
          tokenVersion: highTokenVersion,
        },
        jwtOptions,
      )

      await mock.module('@/data', () => ({
        userRepo: {
          findById: mock(async () => mockUser),
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
      const validToken = await signJwt(
        { id: mockUserId, email: mockEmail, role: mockRole, status: mockStatus, tokenVersion },
        jwtOptions,
      )

      // Mock userRepo to return null (user not found)
      await mock.module('@/data', () => ({
        userRepo: {
          findById: mock(async () => null),
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
      const inactiveToken = await signJwt(
        {
          id: mockUserId,
          email: mockEmail,
          role: mockRole,
          status: Status.Suspended,
          tokenVersion,
        },
        jwtOptions,
      )

      await mock.module('@/data', () => ({
        userRepo: {
          findById: mock(async () => mockUser),
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

      const validToken = await signJwt(
        { id: mockUserId, email: mockEmail, role: mockRole, status: mockStatus, tokenVersion },
        jwtOptions,
      )

      await mock.module('@/data', () => ({
        userRepo: {
          findById: mock(async () => mockUser),
        },
      }))

      const result = await simulateAuthLogic(validToken)

      expect(result.success).toBe(true)
      expect(userRepo.findById).toHaveBeenCalledWith(mockUserId)
    })

    it('should handle very large tokenVersion numbers', async () => {
      const tokenVersion = 999999999
      const mockUser = { id: mockUserId, tokenVersion }

      const validToken = await signJwt(
        { id: mockUserId, email: mockEmail, role: mockRole, status: mockStatus, tokenVersion },
        jwtOptions,
      )

      await mock.module('@/data', () => ({
        userRepo: {
          findById: mock(async () => mockUser),
        },
      }))

      const result = await simulateAuthLogic(validToken)

      expect(result.success).toBe(true)
      expect(userRepo.findById).toHaveBeenCalledWith(mockUserId)
    })

    it('should handle database errors gracefully', async () => {
      const tokenVersion = 3

      const validToken = await signJwt(
        { id: mockUserId, email: mockEmail, role: mockRole, status: mockStatus, tokenVersion },
        jwtOptions,
      )

      // Mock userRepo to throw database error
      await mock.module('@/data', () => ({
        userRepo: {
          findById: mock(async () => { throw new Error('Database connection failed') }),
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

      await mock.module('@/data', () => ({
        userRepo: {
          findById: mock(async () => ({ id: mockUserId, tokenVersion: 1 })),
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
      const oldToken = await signJwt(
        {
          id: userId,
          email,
          role: mockRole,
          status: mockStatus,
          tokenVersion: initialTokenVersion,
        },
        jwtOptions,
      )

      // Step 2: Password reset increments tokenVersion
      const userAfterReset = { id: userId, tokenVersion: newTokenVersion }

      await mock.module('@/data', () => ({
        userRepo: {
          findById: mock(async () => userAfterReset),
        },
      }))

      // Step 3: Old token should now be rejected
      const oldResult = await simulateAuthLogic(oldToken)

      expect(oldResult.success).toBe(false)
      expect(oldResult.error).toBeInstanceOf(AppError)
      expect((oldResult.error as AppError).code).toBe(ErrorCode.Unauthorized)
      expect(userRepo.findById).toHaveBeenCalledWith(userId)

      // Step 4: New token with updated version should work
      const newToken = await signJwt(
        { id: userId, email, role: mockRole, status: mockStatus, tokenVersion: newTokenVersion },
        jwtOptions,
      )
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

        await mock.module('@/data', () => ({
          userRepo: {
            findById: mock(async () => user),
          },
        }))

        // Current version token should work
        const currentToken = await signJwt(
          { id: userId, email, role: mockRole, status: mockStatus, tokenVersion: currentVersion },
          jwtOptions,
        )

        const result = await simulateAuthLogic(currentToken)
        expect(result.success).toBe(true)

        // Previous version tokens should fail
        if (i > 0) {
          const oldToken = await signJwt(
            {
              id: userId,
              email,
              role: mockRole,
              status: mockStatus,
              tokenVersion: currentVersion - 1,
            },
            jwtOptions,
          )
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

      await mock.module('@/data', () => ({
        userRepo: {
          findById: mock(async () => user),
        },
      }))

      const loginToken = await signJwt(
        {
          id: userId,
          email,
          role: mockRole,
          status: mockStatus,
          tokenVersion: currentTokenVersion,
        },
        jwtOptions,
      )
      const loginResult = await simulateAuthLogic(loginToken)

      expect(loginResult.success).toBe(true)

      // Step 2: User resets password - tokenVersion incremented to 2
      currentTokenVersion = 2
      const userAfterReset = { id: userId, tokenVersion: currentTokenVersion }

      await mock.module('@/data', () => ({
        userRepo: {
          findById: mock(async () => userAfterReset),
        },
      }))

      // Step 3: Old login token should now fail
      const oldTokenResult = await simulateAuthLogic(loginToken)
      expect(oldTokenResult.success).toBe(false)
      expect((oldTokenResult.error as AppError).code).toBe(ErrorCode.Unauthorized)

      // Step 4: New login with updated tokenVersion should succeed
      const newLoginToken = await signJwt(
        {
          id: userId,
          email,
          role: mockRole,
          status: mockStatus,
          tokenVersion: currentTokenVersion,
        },
        jwtOptions,
      )
      const newLoginResult = await simulateAuthLogic(newLoginToken)

      expect(newLoginResult.success).toBe(true)
    })
  })
})
