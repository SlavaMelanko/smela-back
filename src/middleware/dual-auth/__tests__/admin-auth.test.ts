import { beforeEach, describe, expect, it, mock } from 'bun:test'

import { userRepo } from '@/data'
import { AppError, ErrorCode } from '@/lib/catch'
import jwt from '@/lib/jwt'
import { isActiveOnly, isAdmin, Role, Status } from '@/types'

describe('Admin Authentication Middleware', () => {
  const tokenVersion = 1

  // Simulate the core auth logic from the middleware with both validators
  const simulateAuthLogic = async (
    token: string,
    statusValidator: (status: Status) => boolean,
    roleValidator: (role: Role) => boolean,
  ) => {
    try {
      const payload = await jwt.verify(token)

      if (!statusValidator(payload.status)) {
        throw new AppError(ErrorCode.Forbidden, 'Status validation failure')
      }

      if (!roleValidator(payload.role)) {
        throw new AppError(ErrorCode.Forbidden, 'Role validation failure')
      }

      // Fetch current user to validate token version
      const user = await userRepo.findById(payload.id)
      if (!user || user.tokenVersion !== (payload.v)) {
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

  describe('Role Helper Functions', () => {
    it('isAdmin should return true for Admin role', () => {
      expect(isAdmin(Role.Admin)).toBe(true)
    })

    it('isAdmin should return true for Owner role', () => {
      expect(isAdmin(Role.Owner)).toBe(true)
    })

    it('isAdmin should return false for User role', () => {
      expect(isAdmin(Role.User)).toBe(false)
    })

    it('isAdmin should return false for Enterprise role', () => {
      expect(isAdmin(Role.Enterprise)).toBe(false)
    })
  })

  describe('Admin Middleware with Role Validation', () => {
    it('should allow Owner with Active status', async () => {
      const mockUser = { id: 1, tokenVersion, email: 'owner@example.com' }
      const ownerToken = await jwt.sign(1, 'owner@example.com', Role.Owner, Status.Active, tokenVersion)

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
      const ownerToken = await jwt.sign(1, 'owner@example.com', Role.Owner, Status.Verified, tokenVersion)

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
      const adminToken = await jwt.sign(2, 'admin@example.com', Role.Admin, Status.Active, tokenVersion)

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
      const userToken = await jwt.sign(3, 'user@example.com', Role.User, Status.Active, tokenVersion)

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
      const enterpriseToken = await jwt.sign(4, 'enterprise@example.com', Role.Enterprise, Status.Active, tokenVersion)

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
      const suspendedAdminToken = await jwt.sign(5, 'suspended-admin@example.com', Role.Admin, Status.Suspended, tokenVersion)

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
      const newOwnerToken = await jwt.sign(6, 'new-owner@example.com', Role.Owner, Status.New, tokenVersion)

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

      const adminToken = await jwt.sign(
        adminId,
        adminEmail,
        Role.Admin,
        Status.Active,
        tokenVersion,
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

      const ownerToken = await jwt.sign(
        ownerId,
        ownerEmail,
        Role.Owner,
        Status.Active,
        tokenVersion,
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

      const userToken = await jwt.sign(userId, userEmail, Role.User, Status.Verified, tokenVersion)

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
      const trialAdminToken = await jwt.sign(200, 'trial-admin@example.com', Role.Admin, Status.Trial, tokenVersion)

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
      const verifiedAdminToken = await jwt.sign(199, 'verified-admin@example.com', Role.Admin, Status.Verified, tokenVersion)

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
      const pendingOwnerToken = await jwt.sign(201, 'pending-owner@example.com', Role.Owner, Status.Pending, tokenVersion)

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
      const archivedAdminToken = await jwt.sign(202, 'archived-admin@example.com', Role.Admin, Status.Archived, tokenVersion)

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
