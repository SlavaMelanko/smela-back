import { beforeEach, describe, expect, it, mock } from 'bun:test'

import { userRepo } from '@/data'
import { signJwt, verifyJwt } from '@/jwt'
import { AppError, ErrorCode } from '@/lib/catch'
import { isActiveOnly, isAdmin, Role, Status } from '@/types'

import { jwtOptions } from './jwt-utils'

describe('Admin Authentication Middleware', () => {
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

  describe('Admin Middleware with Role Validation', () => {
    it('should allow Owner with Active status', async () => {
      const mockUser = { id: 1, tokenVersion, email: 'owner@example.com' }
      const ownerToken = await signJwt(
        { id: 1, email: 'owner@example.com', role: Role.Owner, status: Status.Active, tokenVersion },
        jwtOptions,
      )

      await mock.module('@/data', () => ({
        userRepo: {
          findById: mock(async () => mockUser),
        },
      }))

      const result = await simulateAuthLogic(ownerToken, isActiveOnly, isAdmin)

      expect(result.success).toBe(true)
      expect(result.user).toBeDefined()
      expect(result.user?.role).toBe(Role.Owner)
    })

    it('should reject Owner with Verified status (not fully active)', async () => {
      const mockUser = { id: 1, tokenVersion, email: 'owner@example.com' }
      const ownerToken = await signJwt(
        { id: 1, email: 'owner@example.com', role: Role.Owner, status: Status.Verified, tokenVersion },
        jwtOptions,
      )

      await mock.module('@/data', () => ({
        userRepo: {
          findById: mock(async () => mockUser),
        },
      }))

      const result = await simulateAuthLogic(ownerToken, isActiveOnly, isAdmin)

      expect(result.success).toBe(false)
      expect(result.error).toBeInstanceOf(AppError)
      expect((result.error as AppError).code).toBe(ErrorCode.Forbidden)
      expect((result.error as AppError).message).toBe('Status validation failure')
    })

    it('should allow Admin with active status', async () => {
      const mockUser = { id: 2, tokenVersion, email: 'admin@example.com' }
      const adminToken = await signJwt(
        { id: 2, email: 'admin@example.com', role: Role.Admin, status: Status.Active, tokenVersion },
        jwtOptions,
      )

      await mock.module('@/data', () => ({
        userRepo: {
          findById: mock(async () => mockUser),
        },
      }))

      const result = await simulateAuthLogic(adminToken, isActiveOnly, isAdmin)

      expect(result.success).toBe(true)
      expect(result.user).toBeDefined()
      expect(result.user?.role).toBe(Role.Admin)
    })

    it('should reject User role even with active status', async () => {
      const mockUser = { id: 3, tokenVersion, email: 'user@example.com' }
      const userToken = await signJwt(
        { id: 3, email: 'user@example.com', role: Role.User, status: Status.Active, tokenVersion },
        jwtOptions,
      )

      await mock.module('@/data', () => ({
        userRepo: {
          findById: mock(async () => mockUser),
        },
      }))

      const result = await simulateAuthLogic(userToken, isActiveOnly, isAdmin)

      expect(result.success).toBe(false)
      expect(result.error).toBeInstanceOf(AppError)
      expect((result.error as AppError).code).toBe(ErrorCode.Forbidden)
      expect((result.error as AppError).message).toBe('Role validation failure')
    })

    it('should reject Enterprise role even with active status', async () => {
      const mockUser = { id: 4, tokenVersion, email: 'enterprise@example.com' }
      const enterpriseToken = await signJwt(
        { id: 4, email: 'enterprise@example.com', role: Role.Enterprise, status: Status.Active, tokenVersion },
        jwtOptions,
      )

      await mock.module('@/data', () => ({
        userRepo: {
          findById: mock(async () => mockUser),
        },
      }))

      const result = await simulateAuthLogic(enterpriseToken, isActiveOnly, isAdmin)

      expect(result.success).toBe(false)
      expect(result.error).toBeInstanceOf(AppError)
      expect((result.error as AppError).code).toBe(ErrorCode.Forbidden)
      expect((result.error as AppError).message).toBe('Role validation failure')
    })

    it('should reject Admin with inactive status', async () => {
      const mockUser = { id: 5, tokenVersion, email: 'suspended-admin@example.com' }
      const suspendedAdminToken = await signJwt(
        { id: 5, email: 'suspended-admin@example.com', role: Role.Admin, status: Status.Suspended, tokenVersion },
        jwtOptions,
      )

      await mock.module('@/data', () => ({
        userRepo: {
          findById: mock(async () => mockUser),
        },
      }))

      const result = await simulateAuthLogic(suspendedAdminToken, isActiveOnly, isAdmin)

      expect(result.success).toBe(false)
      expect(result.error).toBeInstanceOf(AppError)
      expect((result.error as AppError).code).toBe(ErrorCode.Forbidden)
    })

    it('should reject Owner with New status', async () => {
      const mockUser = { id: 6, tokenVersion, email: 'new-owner@example.com' }
      const newOwnerToken = await signJwt(
        { id: 6, email: 'new-owner@example.com', role: Role.Owner, status: Status.New, tokenVersion },
        jwtOptions,
      )

      await mock.module('@/data', () => ({
        userRepo: {
          findById: mock(async () => mockUser),
        },
      }))

      const result = await simulateAuthLogic(newOwnerToken, isActiveOnly, isAdmin)

      expect(result.success).toBe(false)
      expect(result.error).toBeInstanceOf(AppError)
      expect((result.error as AppError).code).toBe(ErrorCode.Forbidden)
    })
  })

  describe('Real-world Use Cases', () => {
    it('should allow admin to access admin endpoints', async () => {
      const adminId = 100
      const adminEmail = 'admin@company.com'
      const mockAdmin = {
        id: adminId,
        tokenVersion,
        email: adminEmail,
        role: Role.Admin,
        status: Status.Active,
      }

      const adminToken = await signJwt(
        { id: adminId, email: adminEmail, role: Role.Admin, status: Status.Active, tokenVersion },
        jwtOptions,
      )

      await mock.module('@/data', () => ({
        userRepo: {
          findById: mock(async () => mockAdmin),
        },
      }))

      // Simulate access to admin endpoint with both validators
      const result = await simulateAuthLogic(adminToken, isActiveOnly, isAdmin)

      expect(result.success).toBe(true)
      expect(result.user).toBeDefined()
      expect(result.user?.id).toBe(adminId)
      expect(result.user?.email).toBe(adminEmail)
      expect(result.user?.role).toBe(Role.Admin)
    })

    it('should allow owner to access admin endpoints', async () => {
      const ownerId = 101
      const ownerEmail = 'owner@company.com'
      const mockOwner = {
        id: ownerId,
        tokenVersion,
        email: ownerEmail,
        role: Role.Owner,
        status: Status.Active,
      }

      const ownerToken = await signJwt(
        { id: ownerId, email: ownerEmail, role: Role.Owner, status: Status.Active, tokenVersion },
        jwtOptions,
      )

      await mock.module('@/data', () => ({
        userRepo: {
          findById: mock(async () => mockOwner),
        },
      }))

      // Simulate access to admin endpoint with both validators
      const result = await simulateAuthLogic(ownerToken, isActiveOnly, isAdmin)

      expect(result.success).toBe(true)
      expect(result.user).toBeDefined()
      expect(result.user?.id).toBe(ownerId)
      expect(result.user?.email).toBe(ownerEmail)
      expect(result.user?.role).toBe(Role.Owner)
    })

    it('should block regular user from admin endpoints', async () => {
      const userId = 102
      const userEmail = 'user@company.com'
      const mockUser = {
        id: userId,
        tokenVersion,
        email: userEmail,
        role: Role.User,
        status: Status.Verified,
      }

      const userToken = await signJwt(
        { id: userId, email: userEmail, role: Role.User, status: Status.Verified, tokenVersion },
        jwtOptions,
      )

      await mock.module('@/data', () => ({
        userRepo: {
          findById: mock(async () => mockUser),
        },
      }))

      // Simulate access to admin endpoint with both validators
      const result = await simulateAuthLogic(userToken, isActiveOnly, isAdmin)

      expect(result.success).toBe(false)
      expect(result.error).toBeInstanceOf(AppError)
      expect((result.error as AppError).code).toBe(ErrorCode.Forbidden)
    })
  })

  describe('Edge Cases', () => {
    it('should reject trial status for admin (requires fully active)', async () => {
      const mockUser = { id: 200, tokenVersion, email: 'trial-admin@example.com' }
      const trialAdminToken = await signJwt(
        { id: 200, email: 'trial-admin@example.com', role: Role.Admin, status: Status.Trial, tokenVersion },
        jwtOptions,
      )

      await mock.module('@/data', () => ({
        userRepo: {
          findById: mock(async () => mockUser),
        },
      }))

      const result = await simulateAuthLogic(trialAdminToken, isActiveOnly, isAdmin)

      expect(result.success).toBe(false)
      expect(result.error).toBeInstanceOf(AppError)
      expect((result.error as AppError).code).toBe(ErrorCode.Forbidden)
    })

    it('should reject verified status for admin (requires fully active)', async () => {
      const mockUser = { id: 199, tokenVersion, email: 'verified-admin@example.com' }
      const verifiedAdminToken = await signJwt(
        { id: 199, email: 'verified-admin@example.com', role: Role.Admin, status: Status.Verified, tokenVersion },
        jwtOptions,
      )

      await mock.module('@/data', () => ({
        userRepo: {
          findById: mock(async () => mockUser),
        },
      }))

      const result = await simulateAuthLogic(verifiedAdminToken, isActiveOnly, isAdmin)

      expect(result.success).toBe(false)
      expect(result.error).toBeInstanceOf(AppError)
      expect((result.error as AppError).code).toBe(ErrorCode.Forbidden)
    })

    it('should reject pending status for owner', async () => {
      const mockUser = { id: 201, tokenVersion, email: 'pending-owner@example.com' }
      const pendingOwnerToken = await signJwt(
        { id: 201, email: 'pending-owner@example.com', role: Role.Owner, status: Status.Pending, tokenVersion },
        jwtOptions,
      )

      await mock.module('@/data', () => ({
        userRepo: {
          findById: mock(async () => mockUser),
        },
      }))

      const result = await simulateAuthLogic(pendingOwnerToken, isActiveOnly, isAdmin)

      expect(result.success).toBe(false)
      expect(result.error).toBeInstanceOf(AppError)
      expect((result.error as AppError).code).toBe(ErrorCode.Forbidden)
    })

    it('should reject archived status for admin', async () => {
      const mockUser = { id: 202, tokenVersion, email: 'archived-admin@example.com' }
      const archivedAdminToken = await signJwt(
        { id: 202, email: 'archived-admin@example.com', role: Role.Admin, status: Status.Archived, tokenVersion },
        jwtOptions,
      )

      await mock.module('@/data', () => ({
        userRepo: {
          findById: mock(async () => mockUser),
        },
      }))

      const result = await simulateAuthLogic(archivedAdminToken, isActiveOnly, isAdmin)

      expect(result.success).toBe(false)
      expect(result.error).toBeInstanceOf(AppError)
      expect((result.error as AppError).code).toBe(ErrorCode.Forbidden)
    })
  })
})
