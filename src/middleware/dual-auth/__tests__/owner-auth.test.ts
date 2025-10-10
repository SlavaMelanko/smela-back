import { beforeEach, describe, expect, it, mock } from 'bun:test'

import { userRepo } from '@/data'
import { signJwt, verifyJwt } from '@/jwt'
import { AppError, ErrorCode } from '@/lib/catch'
import { isActiveOnly, isOwner, Role, Status } from '@/types'

import { jwtOptions } from './jwt-utils'

describe('Owner Authentication Middleware', () => {
  const tokenVersion = 1

  // Simulate the core auth logic from the middleware with both validators
  const simulateAuthLogic = async (
    token: string,
    statusValidator: (status: Status) => boolean,
    roleValidator: (role: Role) => boolean,
  ) => {
    try {
      const payload = await verifyJwt(token, jwtOptions)

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

  describe('Owner-Only Middleware', () => {
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

      const result = await simulateAuthLogic(ownerToken, isActiveOnly, isOwner)

      expect(result.success).toBe(true)
      expect(result.user).toBeDefined()
      expect(result.user?.role).toBe(Role.Owner)
    })

    it('should reject Admin even with Active status', async () => {
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

      const result = await simulateAuthLogic(adminToken, isActiveOnly, isOwner)

      expect(result.success).toBe(false)
      expect(result.error).toBeInstanceOf(AppError)
      expect((result.error as AppError).code).toBe(ErrorCode.Forbidden)
      expect((result.error as AppError).message).toBe('Role validation failure')
    })

    it('should reject User role with Active status', async () => {
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

      const result = await simulateAuthLogic(userToken, isActiveOnly, isOwner)

      expect(result.success).toBe(false)
      expect(result.error).toBeInstanceOf(AppError)
      expect((result.error as AppError).code).toBe(ErrorCode.Forbidden)
      expect((result.error as AppError).message).toBe('Role validation failure')
    })

    it('should reject Enterprise role with Active status', async () => {
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

      const result = await simulateAuthLogic(enterpriseToken, isActiveOnly, isOwner)

      expect(result.success).toBe(false)
      expect(result.error).toBeInstanceOf(AppError)
      expect((result.error as AppError).code).toBe(ErrorCode.Forbidden)
      expect((result.error as AppError).message).toBe('Role validation failure')
    })

    it('should reject Owner with Verified status (not fully active)', async () => {
      const mockUser = { id: 5, tokenVersion, email: 'owner@example.com' }
      const ownerToken = await signJwt(
        { id: 5, email: 'owner@example.com', role: Role.Owner, status: Status.Verified, tokenVersion },
        jwtOptions,
      )

      await mock.module('@/data', () => ({
        userRepo: {
          findById: mock(async () => mockUser),
        },
      }))

      const result = await simulateAuthLogic(ownerToken, isActiveOnly, isOwner)

      expect(result.success).toBe(false)
      expect(result.error).toBeInstanceOf(AppError)
      expect((result.error as AppError).code).toBe(ErrorCode.Forbidden)
      expect((result.error as AppError).message).toBe('Status validation failure')
    })

    it('should reject Owner with Trial status', async () => {
      const mockUser = { id: 6, tokenVersion, email: 'owner@example.com' }
      const ownerToken = await signJwt(
        { id: 6, email: 'owner@example.com', role: Role.Owner, status: Status.Trial, tokenVersion },
        jwtOptions,
      )

      await mock.module('@/data', () => ({
        userRepo: {
          findById: mock(async () => mockUser),
        },
      }))

      const result = await simulateAuthLogic(ownerToken, isActiveOnly, isOwner)

      expect(result.success).toBe(false)
      expect(result.error).toBeInstanceOf(AppError)
      expect((result.error as AppError).code).toBe(ErrorCode.Forbidden)
      expect((result.error as AppError).message).toBe('Status validation failure')
    })
  })

  describe('Real-world Use Cases', () => {
    it('should allow owner to manage admin users', async () => {
      const ownerId = 100
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

      // Simulate access to owner-only endpoint
      const result = await simulateAuthLogic(adminToken, isActiveOnly, isOwner)

      expect(result.success).toBe(false)
      expect(result.error).toBeInstanceOf(AppError)
      expect((result.error as AppError).code).toBe(ErrorCode.Forbidden)
      expect((result.error as AppError).message).toBe('Role validation failure')
    })
  })
})
