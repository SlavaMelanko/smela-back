import { beforeEach, describe, expect, it, mock } from 'bun:test'

import { userRepo } from '@/data'
import { AppError, ErrorCode } from '@/lib/catch'
import jwt from '@/lib/jwt'
import { isActiveOnly, isEnterprise, Role, Status } from '@/types'

describe('Enterprise Authentication Middleware', () => {
  const tokenVersion = 1

  // Simulate the core auth logic from the middleware with both validators
  const simulateAuthLogic = async (
    token: string,
    statusValidator: (status: Status) => boolean,
    roleValidator: (role: Role) => boolean,
  ) => {
    try {
      const payload = await jwt.verify(token)

      if (!statusValidator(payload.status as Status)) {
        throw new AppError(ErrorCode.Forbidden, 'Status validation failure')
      }

      if (!roleValidator(payload.role as Role)) {
        throw new AppError(ErrorCode.Forbidden, 'Role validation failure')
      }

      // Fetch current user to validate token version
      const user = await userRepo.findById(payload.id as number)
      if (!user || user.tokenVersion !== (payload.v as number)) {
        throw new AppError(ErrorCode.Unauthorized, 'Token version mismatch')
      }

      return { success: true, user: payload }
    } catch (error) {
      return { success: false, error }
    }
  }

  beforeEach(() => {
    // Reset mocks before each test
  })

  describe('Enterprise Role Helper Function', () => {
    it('isEnterprise should return true only for Enterprise role', () => {
      expect(isEnterprise(Role.Enterprise)).toBe(true)
      expect(isEnterprise(Role.User)).toBe(false)
      expect(isEnterprise(Role.Admin)).toBe(false)
      expect(isEnterprise(Role.Owner)).toBe(false)
    })
  })

  describe('Enterprise-Only Middleware', () => {
    it('should allow Enterprise with Active status', async () => {
      const mockUser = { id: 1, tokenVersion, email: 'enterprise@example.com' }
      const enterpriseToken = await jwt.sign(1, 'enterprise@example.com', Role.Enterprise, Status.Active, tokenVersion)

      mock.module('@/data', () => ({
        userRepo: {
          findById: mock(() => Promise.resolve(mockUser)),
        },
      }))

      const result = await simulateAuthLogic(enterpriseToken, isActiveOnly, isEnterprise)

      expect(result.success).toBe(true)
      expect(result.user).toBeDefined()
      expect(result.user?.role).toBe(Role.Enterprise)
    })

    it('should reject Enterprise with Verified status (requires fully active)', async () => {
      const mockUser = { id: 2, tokenVersion, email: 'enterprise@example.com' }
      const enterpriseToken = await jwt.sign(2, 'enterprise@example.com', Role.Enterprise, Status.Verified, tokenVersion)

      mock.module('@/data', () => ({
        userRepo: {
          findById: mock(() => Promise.resolve(mockUser)),
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
      const enterpriseToken = await jwt.sign(3, 'enterprise@example.com', Role.Enterprise, Status.Trial, tokenVersion)

      mock.module('@/data', () => ({
        userRepo: {
          findById: mock(() => Promise.resolve(mockUser)),
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
      const userToken = await jwt.sign(4, 'user@example.com', Role.User, Status.Active, tokenVersion)

      mock.module('@/data', () => ({
        userRepo: {
          findById: mock(() => Promise.resolve(mockUser)),
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
      const adminToken = await jwt.sign(5, 'admin@example.com', Role.Admin, Status.Active, tokenVersion)

      mock.module('@/data', () => ({
        userRepo: {
          findById: mock(() => Promise.resolve(mockUser)),
        },
      }))

      const result = await simulateAuthLogic(adminToken, isActiveOnly, isEnterprise)

      expect(result.success).toBe(false)
      expect(result.error).toBeInstanceOf(AppError)
      expect((result.error as AppError).code).toBe(ErrorCode.Forbidden)
    })

    it('should reject Owner role with Active status', async () => {
      const mockUser = { id: 6, tokenVersion, email: 'owner@example.com' }
      const ownerToken = await jwt.sign(6, 'owner@example.com', Role.Owner, Status.Active, tokenVersion)

      mock.module('@/data', () => ({
        userRepo: {
          findById: mock(() => Promise.resolve(mockUser)),
        },
      }))

      const result = await simulateAuthLogic(ownerToken, isActiveOnly, isEnterprise)

      expect(result.success).toBe(false)
      expect(result.error).toBeInstanceOf(AppError)
      expect((result.error as AppError).code).toBe(ErrorCode.Forbidden)
    })

    it('should reject Enterprise with New status', async () => {
      const mockUser = { id: 7, tokenVersion, email: 'enterprise@example.com' }
      const enterpriseToken = await jwt.sign(7, 'enterprise@example.com', Role.Enterprise, Status.New, tokenVersion)

      mock.module('@/data', () => ({
        userRepo: {
          findById: mock(() => Promise.resolve(mockUser)),
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
      const enterpriseToken = await jwt.sign(8, 'enterprise@example.com', Role.Enterprise, Status.Suspended, tokenVersion)

      mock.module('@/data', () => ({
        userRepo: {
          findById: mock(() => Promise.resolve(mockUser)),
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
      const mockEnterprise = { id: enterpriseId, tokenVersion, email: enterpriseEmail, role: Role.Enterprise, status: Status.Active }

      const enterpriseToken = await jwt.sign(enterpriseId, enterpriseEmail, Role.Enterprise, Status.Active, tokenVersion)

      mock.module('@/data', () => ({
        userRepo: {
          findById: mock(() => Promise.resolve(mockEnterprise)),
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
      const mockUser = { id: userId, tokenVersion, email: userEmail, role: Role.User, status: Status.Active }

      const userToken = await jwt.sign(userId, userEmail, Role.User, Status.Active, tokenVersion)

      mock.module('@/data', () => ({
        userRepo: {
          findById: mock(() => Promise.resolve(mockUser)),
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
