import { beforeEach, describe, expect, it, mock } from 'bun:test'

import { userRepo } from '@/data'
import { signJwt, verifyJwt } from '@/jwt'
import { AppError, ErrorCode } from '@/lib/catch'
import { isActiveOnly, isEnterprise, Role, Status } from '@/types'

import { jwtOptions } from './jwt-utils'

describe('Enterprise Authentication Middleware', () => {
  const tokenVersion = 1

  // Simulate the core auth logic from the middleware with both validators
  const simulateAuthLogic = async (
    token: string,
    statusValidator: (status: Status) => boolean,
    roleValidator: (role: Role) => boolean,
  ) => {
    try {
      const userClaims = await verifyJwt(token, jwtOptions)

      if (!statusValidator(userClaims.status)) {
        throw new AppError(ErrorCode.Forbidden, 'Status validation failure')
      }

      if (!roleValidator(userClaims.role)) {
        throw new AppError(ErrorCode.Forbidden, 'Role validation failure')
      }

      // Fetch current user to validate token version
      const user = await userRepo.findById(userClaims.id)
      if (!user || user.tokenVersion !== userClaims.tokenVersion) {
        throw new AppError(ErrorCode.Unauthorized, 'Token version mismatch')
      }

      return { success: true, user: userClaims }
    } catch (error) {
      return { success: false, error }
    }
  }

  beforeEach(() => {
    // Reset mocks before each test
  })

  describe('Enterprise-Only Middleware', () => {
    it('should allow Enterprise with Active status', async () => {
      const mockUser = { id: 1, tokenVersion, email: 'enterprise@example.com' }
      const enterpriseToken = await signJwt(
        { id: 1, email: 'enterprise@example.com', role: Role.Enterprise, status: Status.Active, tokenVersion },
        jwtOptions,
      )

      await mock.module('@/data', () => ({
        userRepo: {
          findById: mock(async () => mockUser),
        },
      }))

      const result = await simulateAuthLogic(enterpriseToken, isActiveOnly, isEnterprise)

      expect(result.success).toBe(true)
      expect(result.user).toBeDefined()
      expect(result.user?.role).toBe(Role.Enterprise)
    })

    it('should reject Enterprise with Verified status (requires fully active)', async () => {
      const mockUser = { id: 2, tokenVersion, email: 'enterprise@example.com' }
      const enterpriseToken = await signJwt(
        { id: 2, email: 'enterprise@example.com', role: Role.Enterprise, status: Status.Verified, tokenVersion },
        jwtOptions,
      )

      await mock.module('@/data', () => ({
        userRepo: {
          findById: mock(async () => mockUser),
        },
      }))

      const result = await simulateAuthLogic(enterpriseToken, isActiveOnly, isEnterprise)

      expect(result.success).toBe(false)
      expect(result.error).toBeInstanceOf(AppError)
      expect((result.error as AppError).code).toBe(ErrorCode.Forbidden)
      expect((result.error as AppError).message).toBe('Status validation failure')
    })

    it('should reject Enterprise with Trial status (requires fully active)', async () => {
      const mockUser = { id: 3, tokenVersion, email: 'enterprise@example.com' }
      const enterpriseToken = await signJwt(
        { id: 3, email: 'enterprise@example.com', role: Role.Enterprise, status: Status.Trial, tokenVersion },
        jwtOptions,
      )

      await mock.module('@/data', () => ({
        userRepo: {
          findById: mock(async () => mockUser),
        },
      }))

      const result = await simulateAuthLogic(enterpriseToken, isActiveOnly, isEnterprise)

      expect(result.success).toBe(false)
      expect(result.error).toBeInstanceOf(AppError)
      expect((result.error as AppError).code).toBe(ErrorCode.Forbidden)
      expect((result.error as AppError).message).toBe('Status validation failure')
    })

    it('should reject User role even with Active status', async () => {
      const mockUser = { id: 4, tokenVersion, email: 'user@example.com' }
      const userToken = await signJwt(
        { id: 4, email: 'user@example.com', role: Role.User, status: Status.Active, tokenVersion },
        jwtOptions,
      )

      await mock.module('@/data', () => ({
        userRepo: {
          findById: mock(async () => mockUser),
        },
      }))

      const result = await simulateAuthLogic(userToken, isActiveOnly, isEnterprise)

      expect(result.success).toBe(false)
      expect(result.error).toBeInstanceOf(AppError)
      expect((result.error as AppError).code).toBe(ErrorCode.Forbidden)
      expect((result.error as AppError).message).toBe('Role validation failure')
    })

    it('should reject Admin role with Active status', async () => {
      const mockUser = { id: 5, tokenVersion, email: 'admin@example.com' }
      const adminToken = await signJwt(
        { id: 5, email: 'admin@example.com', role: Role.Admin, status: Status.Active, tokenVersion },
        jwtOptions,
      )

      await mock.module('@/data', () => ({
        userRepo: {
          findById: mock(async () => mockUser),
        },
      }))

      const result = await simulateAuthLogic(adminToken, isActiveOnly, isEnterprise)

      expect(result.success).toBe(false)
      expect(result.error).toBeInstanceOf(AppError)
      expect((result.error as AppError).code).toBe(ErrorCode.Forbidden)
    })

    it('should reject Owner role with Active status', async () => {
      const mockUser = { id: 6, tokenVersion, email: 'owner@example.com' }
      const ownerToken = await signJwt(
        { id: 6, email: 'owner@example.com', role: Role.Owner, status: Status.Active, tokenVersion },
        jwtOptions,
      )

      await mock.module('@/data', () => ({
        userRepo: {
          findById: mock(async () => mockUser),
        },
      }))

      const result = await simulateAuthLogic(ownerToken, isActiveOnly, isEnterprise)

      expect(result.success).toBe(false)
      expect(result.error).toBeInstanceOf(AppError)
      expect((result.error as AppError).code).toBe(ErrorCode.Forbidden)
    })

    it('should reject Enterprise with New status', async () => {
      const mockUser = { id: 7, tokenVersion, email: 'enterprise@example.com' }
      const enterpriseToken = await signJwt(
        { id: 7, email: 'enterprise@example.com', role: Role.Enterprise, status: Status.New, tokenVersion },
        jwtOptions,
      )

      await mock.module('@/data', () => ({
        userRepo: {
          findById: mock(async () => mockUser),
        },
      }))

      const result = await simulateAuthLogic(enterpriseToken, isActiveOnly, isEnterprise)

      expect(result.success).toBe(false)
      expect(result.error).toBeInstanceOf(AppError)
      expect((result.error as AppError).code).toBe(ErrorCode.Forbidden)
      expect((result.error as AppError).message).toBe('Status validation failure')
    })

    it('should reject Enterprise with Suspended status', async () => {
      const mockUser = { id: 8, tokenVersion, email: 'enterprise@example.com' }
      const enterpriseToken = await signJwt(
        { id: 8, email: 'enterprise@example.com', role: Role.Enterprise, status: Status.Suspended, tokenVersion },
        jwtOptions,
      )

      await mock.module('@/data', () => ({
        userRepo: {
          findById: mock(async () => mockUser),
        },
      }))

      const result = await simulateAuthLogic(enterpriseToken, isActiveOnly, isEnterprise)

      expect(result.success).toBe(false)
      expect(result.error).toBeInstanceOf(AppError)
      expect((result.error as AppError).code).toBe(ErrorCode.Forbidden)
    })
  })

  describe('Real-world Use Cases', () => {
    it('should allow enterprise user to access enterprise-only endpoints', async () => {
      const enterpriseId = 100
      const enterpriseEmail = 'enterprise@company.com'
      const mockEnterprise = {
        id: enterpriseId,
        tokenVersion,
        email: enterpriseEmail,
        role: Role.Enterprise,
        status: Status.Active,
      }

      const enterpriseToken = await signJwt(
        {
          id: enterpriseId,
          email: enterpriseEmail,
          role: Role.Enterprise,
          status: Status.Active,
          tokenVersion,
        },
        jwtOptions,
      )

      await mock.module('@/data', () => ({
        userRepo: {
          findById: mock(async () => mockEnterprise),
        },
      }))

      // Simulate access to enterprise-only endpoint
      const result = await simulateAuthLogic(enterpriseToken, isActiveOnly, isEnterprise)

      expect(result.success).toBe(true)
      expect(result.user).toBeDefined()
      expect(result.user?.id).toBe(enterpriseId)
      expect(result.user?.email).toBe(enterpriseEmail)
      expect(result.user?.role).toBe(Role.Enterprise)
    })

    it('should block regular user from enterprise-only endpoints', async () => {
      const userId = 101
      const userEmail = 'user@company.com'
      const mockUser = {
        id: userId,
        tokenVersion,
        email: userEmail,
        role: Role.User,
        status: Status.Active,
      }

      const userToken = await signJwt(
        { id: userId, email: userEmail, role: Role.User, status: Status.Active, tokenVersion },
        jwtOptions,
      )

      await mock.module('@/data', () => ({
        userRepo: {
          findById: mock(async () => mockUser),
        },
      }))

      // Simulate access to enterprise-only endpoint
      const result = await simulateAuthLogic(userToken, isActiveOnly, isEnterprise)

      expect(result.success).toBe(false)
      expect(result.error).toBeInstanceOf(AppError)
      expect((result.error as AppError).code).toBe(ErrorCode.Forbidden)
      expect((result.error as AppError).message).toBe('Role validation failure')
    })
  })
})
