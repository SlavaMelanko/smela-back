import { beforeEach, describe, expect, it, mock } from 'bun:test'

import { jwt } from '@/lib/auth'
import { AppError, ErrorCode } from '@/lib/catch'
import { userRepo } from '@/repositories'
import { Role, Status } from '@/types'
import { isActive, isNewOrActive, isUser } from '@/types'

describe('Dual Auth Middleware - New User Access', () => {
  const mockUserId = 123
  const mockEmail = 'test@example.com'
  const mockRole = Role.User
  const tokenVersion = 1

  // Simulate the core auth logic from the middleware with different validators
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

  describe('isActive validator (original behavior)', () => {
    it('should reject users with status New', async () => {
      const mockUser = { id: mockUserId, tokenVersion, email: mockEmail }
      const newUserToken = await jwt.sign(mockUserId, mockEmail, mockRole, Status.New, tokenVersion)

      mock.module('@/repositories', () => ({
        userRepo: {
          findById: mock(() => Promise.resolve(mockUser)),
        },
      }))

      const result = await simulateAuthLogic(newUserToken, isActive, isUser)

      expect(result.success).toBe(false)
      expect(result.error).toBeInstanceOf(AppError)
      expect((result.error as AppError).code).toBe(ErrorCode.Forbidden)
      expect((result.error as AppError).message).toBe('Status validation failures')
    })

    it('should accept users with status Verified', async () => {
      const mockUser = { id: mockUserId, tokenVersion, email: mockEmail }
      const verifiedToken = await jwt.sign(mockUserId, mockEmail, mockRole, Status.Verified, tokenVersion)

      mock.module('@/repositories', () => ({
        userRepo: {
          findById: mock(() => Promise.resolve(mockUser)),
        },
      }))

      const result = await simulateAuthLogic(verifiedToken, isActive, isUser)

      expect(result.success).toBe(true)
      expect(result.user).toBeDefined()
    })

    it('should accept users with status Trial', async () => {
      const mockUser = { id: mockUserId, tokenVersion, email: mockEmail }
      const trialToken = await jwt.sign(mockUserId, mockEmail, mockRole, Status.Trial, tokenVersion)

      mock.module('@/repositories', () => ({
        userRepo: {
          findById: mock(() => Promise.resolve(mockUser)),
        },
      }))

      const result = await simulateAuthLogic(trialToken, isActive, isUser)

      expect(result.success).toBe(true)
      expect(result.user).toBeDefined()
    })

    it('should accept users with status Active', async () => {
      const mockUser = { id: mockUserId, tokenVersion, email: mockEmail }
      const activeToken = await jwt.sign(mockUserId, mockEmail, mockRole, Status.Active, tokenVersion)

      mock.module('@/repositories', () => ({
        userRepo: {
          findById: mock(() => Promise.resolve(mockUser)),
        },
      }))

      const result = await simulateAuthLogic(activeToken, isActive, isUser)

      expect(result.success).toBe(true)
      expect(result.user).toBeDefined()
    })
  })

  describe('isNewOrActive validator (new behavior)', () => {
    it('should accept users with status New', async () => {
      const mockUser = { id: mockUserId, tokenVersion, email: mockEmail }
      const newUserToken = await jwt.sign(mockUserId, mockEmail, mockRole, Status.New, tokenVersion)

      mock.module('@/repositories', () => ({
        userRepo: {
          findById: mock(() => Promise.resolve(mockUser)),
        },
      }))

      const result = await simulateAuthLogic(newUserToken, isNewOrActive, isUser)

      expect(result.success).toBe(true)
      expect(result.user).toBeDefined()
    })

    it('should accept users with status Verified', async () => {
      const mockUser = { id: mockUserId, tokenVersion, email: mockEmail }
      const verifiedToken = await jwt.sign(mockUserId, mockEmail, mockRole, Status.Verified, tokenVersion)

      mock.module('@/repositories', () => ({
        userRepo: {
          findById: mock(() => Promise.resolve(mockUser)),
        },
      }))

      const result = await simulateAuthLogic(verifiedToken, isNewOrActive, isUser)

      expect(result.success).toBe(true)
      expect(result.user).toBeDefined()
    })

    it('should accept users with status Trial', async () => {
      const mockUser = { id: mockUserId, tokenVersion, email: mockEmail }
      const trialToken = await jwt.sign(mockUserId, mockEmail, mockRole, Status.Trial, tokenVersion)

      mock.module('@/repositories', () => ({
        userRepo: {
          findById: mock(() => Promise.resolve(mockUser)),
        },
      }))

      const result = await simulateAuthLogic(trialToken, isNewOrActive, isUser)

      expect(result.success).toBe(true)
      expect(result.user).toBeDefined()
    })

    it('should accept users with status Active', async () => {
      const mockUser = { id: mockUserId, tokenVersion, email: mockEmail }
      const activeToken = await jwt.sign(mockUserId, mockEmail, mockRole, Status.Active, tokenVersion)

      mock.module('@/repositories', () => ({
        userRepo: {
          findById: mock(() => Promise.resolve(mockUser)),
        },
      }))

      const result = await simulateAuthLogic(activeToken, isNewOrActive, isUser)

      expect(result.success).toBe(true)
      expect(result.user).toBeDefined()
    })

    it('should reject users with status Suspended', async () => {
      const mockUser = { id: mockUserId, tokenVersion, email: mockEmail }
      const suspendedToken = await jwt.sign(mockUserId, mockEmail, mockRole, Status.Suspended, tokenVersion)

      mock.module('@/repositories', () => ({
        userRepo: {
          findById: mock(() => Promise.resolve(mockUser)),
        },
      }))

      const result = await simulateAuthLogic(suspendedToken, isNewOrActive, isUser)

      expect(result.success).toBe(false)
      expect(result.error).toBeInstanceOf(AppError)
      expect((result.error as AppError).code).toBe(ErrorCode.Forbidden)
      expect((result.error as AppError).message).toBe('Status validation failures')
    })

    it('should reject users with status Archived', async () => {
      const mockUser = { id: mockUserId, tokenVersion, email: mockEmail }
      const archivedToken = await jwt.sign(mockUserId, mockEmail, mockRole, Status.Archived, tokenVersion)

      mock.module('@/repositories', () => ({
        userRepo: {
          findById: mock(() => Promise.resolve(mockUser)),
        },
      }))

      const result = await simulateAuthLogic(archivedToken, isNewOrActive, isUser)

      expect(result.success).toBe(false)
      expect(result.error).toBeInstanceOf(AppError)
      expect((result.error as AppError).code).toBe(ErrorCode.Forbidden)
      expect((result.error as AppError).message).toBe('Status validation failures')
    })

    it('should reject users with status Pending', async () => {
      const mockUser = { id: mockUserId, tokenVersion, email: mockEmail }
      const pendingToken = await jwt.sign(mockUserId, mockEmail, mockRole, Status.Pending, tokenVersion)

      mock.module('@/repositories', () => ({
        userRepo: {
          findById: mock(() => Promise.resolve(mockUser)),
        },
      }))

      const result = await simulateAuthLogic(pendingToken, isNewOrActive, isUser)

      expect(result.success).toBe(false)
      expect(result.error).toBeInstanceOf(AppError)
      expect((result.error as AppError).code).toBe(ErrorCode.Forbidden)
      expect((result.error as AppError).message).toBe('Status validation failures')
    })
  })

  describe('Real-world Use Cases', () => {
    it('should allow new user to access /me endpoint', async () => {
      const newUserId = 456
      const newUserEmail = 'newuser@example.com'
      const mockNewUser = { id: newUserId, tokenVersion, email: newUserEmail, status: Status.New }

      const newUserToken = await jwt.sign(newUserId, newUserEmail, mockRole, Status.New, tokenVersion)

      mock.module('@/repositories', () => ({
        userRepo: {
          findById: mock(() => Promise.resolve(mockNewUser)),
        },
      }))

      // Simulate access to /me endpoint with isNewOrActive validator
      const result = await simulateAuthLogic(newUserToken, isNewOrActive, isUser)

      expect(result.success).toBe(true)
      expect(result.user).toBeDefined()
      expect(result.user?.id).toBe(newUserId)
      expect(result.user?.email).toBe(newUserEmail)
      expect(result.user?.status).toBe(Status.New)
    })

    it('should block new user from verified-only endpoints', async () => {
      const newUserId = 789
      const newUserEmail = 'blocked@example.com'
      const mockNewUser = { id: newUserId, tokenVersion, email: newUserEmail, status: Status.New }

      const newUserToken = await jwt.sign(newUserId, newUserEmail, mockRole, Status.New, tokenVersion)

      mock.module('@/repositories', () => ({
        userRepo: {
          findById: mock(() => Promise.resolve(mockNewUser)),
        },
      }))

      // Simulate access to verified-only endpoint with isActive validator
      const result = await simulateAuthLogic(newUserToken, isActive, isUser)

      expect(result.success).toBe(false)
      expect(result.error).toBeInstanceOf(AppError)
      expect((result.error as AppError).code).toBe(ErrorCode.Forbidden)
      expect((result.error as AppError).message).toBe('Status validation failures')
    })
  })
})
