import { beforeEach, describe, expect, it, mock } from 'bun:test'

import { jwt } from '@/lib/auth'
import { AppError, ErrorCode } from '@/lib/catch'
import { userRepo } from '@/repositories'
import { Role, Status } from '@/types'
import { isActiveOnly, isEnterprise, isOwner, isUser } from '@/types'

describe('Owner Authentication Middleware', () => {
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
        throw new AppError(ErrorCode.Forbidden, 'Status validation failures')
      }

      if (!roleValidator(payload.role as Role)) {
        throw new AppError(ErrorCode.Forbidden, 'Role validation failures')
      }

      // Fetch current user to validate token version
      const user = await userRepo.findById(payload.id as number)
      if (!user || user.tokenVersion !== (payload.v as number)) {
        throw new AppError(ErrorCode.Unauthorized, 'Token version mismatches')
      }

      return { success: true, user: payload }
    } catch (error) {
      return { success: false, error }
    }
  }

  beforeEach(() => {
    // Reset mocks before each test
  })

  describe('New Role Helper Functions', () => {
    it('isUser should return true for User role', () => {
      expect(isUser(Role.User)).toBe(true)
    })

    it('isUser should return true for Enterprise role', () => {
      expect(isUser(Role.Enterprise)).toBe(true)
    })

    it('isUser should return false for Admin role', () => {
      expect(isUser(Role.Admin)).toBe(false)
    })

    it('isUser should return false for Owner role', () => {
      expect(isUser(Role.Owner)).toBe(false)
    })

    it('isEnterprise should return true only for Enterprise role', () => {
      expect(isEnterprise(Role.Enterprise)).toBe(true)
      expect(isEnterprise(Role.User)).toBe(false)
      expect(isEnterprise(Role.Admin)).toBe(false)
      expect(isEnterprise(Role.Owner)).toBe(false)
    })

    it('isOwner should return true only for Owner role', () => {
      expect(isOwner(Role.Owner)).toBe(true)
      expect(isOwner(Role.Admin)).toBe(false)
      expect(isOwner(Role.User)).toBe(false)
      expect(isOwner(Role.Enterprise)).toBe(false)
    })
  })

  describe('Owner-Only Middleware', () => {
    it('should allow Owner with Active status', async () => {
      const mockUser = { id: 1, tokenVersion, email: 'owner@example.com' }
      const ownerToken = await jwt.sign(1, 'owner@example.com', Role.Owner, Status.Active, tokenVersion)

      mock.module('@/repositories', () => ({
        userRepo: {
          findById: mock(() => Promise.resolve(mockUser)),
        },
      }))

      const result = await simulateAuthLogic(ownerToken, isActiveOnly, isOwner)

      expect(result.success).toBe(true)
      expect(result.user).toBeDefined()
      expect(result.user?.role).toBe(Role.Owner)
    })

    it('should reject Admin even with Active status', async () => {
      const mockUser = { id: 2, tokenVersion, email: 'admin@example.com' }
      const adminToken = await jwt.sign(2, 'admin@example.com', Role.Admin, Status.Active, tokenVersion)

      mock.module('@/repositories', () => ({
        userRepo: {
          findById: mock(() => Promise.resolve(mockUser)),
        },
      }))

      const result = await simulateAuthLogic(adminToken, isActiveOnly, isOwner)

      expect(result.success).toBe(false)
      expect(result.error).toBeInstanceOf(AppError)
      expect((result.error as AppError).code).toBe(ErrorCode.Forbidden)
      expect((result.error as AppError).message).toBe('Role validation failures')
    })

    it('should reject User role with Active status', async () => {
      const mockUser = { id: 3, tokenVersion, email: 'user@example.com' }
      const userToken = await jwt.sign(3, 'user@example.com', Role.User, Status.Active, tokenVersion)

      mock.module('@/repositories', () => ({
        userRepo: {
          findById: mock(() => Promise.resolve(mockUser)),
        },
      }))

      const result = await simulateAuthLogic(userToken, isActiveOnly, isOwner)

      expect(result.success).toBe(false)
      expect(result.error).toBeInstanceOf(AppError)
      expect((result.error as AppError).code).toBe(ErrorCode.Forbidden)
      expect((result.error as AppError).message).toBe('Role validation failures')
    })

    it('should reject Enterprise role with Active status', async () => {
      const mockUser = { id: 4, tokenVersion, email: 'enterprise@example.com' }
      const enterpriseToken = await jwt.sign(4, 'enterprise@example.com', Role.Enterprise, Status.Active, tokenVersion)

      mock.module('@/repositories', () => ({
        userRepo: {
          findById: mock(() => Promise.resolve(mockUser)),
        },
      }))

      const result = await simulateAuthLogic(enterpriseToken, isActiveOnly, isOwner)

      expect(result.success).toBe(false)
      expect(result.error).toBeInstanceOf(AppError)
      expect((result.error as AppError).code).toBe(ErrorCode.Forbidden)
      expect((result.error as AppError).message).toBe('Role validation failures')
    })

    it('should reject Owner with Verified status (not fully active)', async () => {
      const mockUser = { id: 5, tokenVersion, email: 'owner@example.com' }
      const ownerToken = await jwt.sign(5, 'owner@example.com', Role.Owner, Status.Verified, tokenVersion)

      mock.module('@/repositories', () => ({
        userRepo: {
          findById: mock(() => Promise.resolve(mockUser)),
        },
      }))

      const result = await simulateAuthLogic(ownerToken, isActiveOnly, isOwner)

      expect(result.success).toBe(false)
      expect(result.error).toBeInstanceOf(AppError)
      expect((result.error as AppError).code).toBe(ErrorCode.Forbidden)
      expect((result.error as AppError).message).toBe('Status validation failures')
    })

    it('should reject Owner with Trial status', async () => {
      const mockUser = { id: 6, tokenVersion, email: 'owner@example.com' }
      const ownerToken = await jwt.sign(6, 'owner@example.com', Role.Owner, Status.Trial, tokenVersion)

      mock.module('@/repositories', () => ({
        userRepo: {
          findById: mock(() => Promise.resolve(mockUser)),
        },
      }))

      const result = await simulateAuthLogic(ownerToken, isActiveOnly, isOwner)

      expect(result.success).toBe(false)
      expect(result.error).toBeInstanceOf(AppError)
      expect((result.error as AppError).code).toBe(ErrorCode.Forbidden)
      expect((result.error as AppError).message).toBe('Status validation failures')
    })
  })

  describe('Real-world Use Cases', () => {
    it('should allow owner to manage admin users', async () => {
      const ownerId = 100
      const ownerEmail = 'owner@company.com'
      const mockOwner = { id: ownerId, tokenVersion, email: ownerEmail, role: Role.Owner, status: Status.Active }

      const ownerToken = await jwt.sign(ownerId, ownerEmail, Role.Owner, Status.Active, tokenVersion)

      mock.module('@/repositories', () => ({
        userRepo: {
          findById: mock(() => Promise.resolve(mockOwner)),
        },
      }))

      // Simulate access to owner-only endpoint for managing admins
      const result = await simulateAuthLogic(ownerToken, isActiveOnly, isOwner)

      expect(result.success).toBe(true)
      expect(result.user).toBeDefined()
      expect(result.user?.id).toBe(ownerId)
      expect(result.user?.email).toBe(ownerEmail)
      expect(result.user?.role).toBe(Role.Owner)
    })

    it('should block admin from owner-only endpoints', async () => {
      const adminId = 101
      const adminEmail = 'admin@company.com'
      const mockAdmin = { id: adminId, tokenVersion, email: adminEmail, role: Role.Admin, status: Status.Active }

      const adminToken = await jwt.sign(adminId, adminEmail, Role.Admin, Status.Active, tokenVersion)

      mock.module('@/repositories', () => ({
        userRepo: {
          findById: mock(() => Promise.resolve(mockAdmin)),
        },
      }))

      // Simulate access to owner-only endpoint
      const result = await simulateAuthLogic(adminToken, isActiveOnly, isOwner)

      expect(result.success).toBe(false)
      expect(result.error).toBeInstanceOf(AppError)
      expect((result.error as AppError).code).toBe(ErrorCode.Forbidden)
      expect((result.error as AppError).message).toBe('Role validation failures')
    })
  })
})
