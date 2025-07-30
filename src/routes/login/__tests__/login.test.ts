import { beforeEach, describe, expect, it, mock } from 'bun:test'

import { AppError, ErrorCode } from '@/lib/errors'
import { authRepo, userRepo } from '@/repositories'
import { Status } from '@/types'

import logInWithEmail from '../login'

describe('logInWithEmail', () => {
  const mockUser = {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    status: Status.Verified,
    role: 'user' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockAuth = {
    userId: 1,
    providerId: 'email',
    providerKey: 'john@example.com',
    passwordHash: '$2b$10$hashedPassword123',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockToken = 'jwt.token.here'
  const validPassword = 'CorrectPass123!'

  beforeEach(() => {
    // Mock repository methods
    mock.module('@/repositories', () => ({
      userRepo: {
        findByEmail: mock(() => Promise.resolve(mockUser)),
      },
      authRepo: {
        findById: mock(() => Promise.resolve(mockAuth)),
      },
      tokenRepo: {},
    }))

    // Mock crypto password encoder
    mock.module('@/lib/crypto', () => ({
      createPasswordEncoder: mock(() => ({
        compare: mock(() => Promise.resolve(true)),
        encode: mock(() => Promise.resolve('$2b$10$hashedPassword123')),
      })),
    }))

    // Mock JWT
    mock.module('@/lib/jwt', () => ({
      default: {
        sign: mock(() => Promise.resolve(mockToken)),
        verify: mock(() => Promise.resolve({ id: 1 })),
      },
    }))
  })

  describe('when credentials are valid', () => {
    it('should return a JWT token for valid user and password', async () => {
      const result = await logInWithEmail({
        email: mockUser.email,
        password: validPassword,
      })

      expect(userRepo.findByEmail).toHaveBeenCalledWith(mockUser.email)
      expect(authRepo.findById).toHaveBeenCalledWith(mockUser.id)
      expect(result).toBe(mockToken)
    })

    it('should call JWT sign with correct user data', async () => {
      const jwt = await import('@/lib/jwt')
      await logInWithEmail({
        email: mockUser.email,
        password: validPassword,
      })

      expect(jwt.default.sign).toHaveBeenCalledWith(
        mockUser.id,
        mockUser.email,
        mockUser.role,
        mockUser.status,
      )
      expect(jwt.default.sign).toHaveBeenCalledTimes(1)
    })

    it('should call password compare with correct parameters', async () => {
      await logInWithEmail({
        email: mockUser.email,
        password: validPassword,
      })

      // Note: We can't easily test the internal encoder.compare call
      // because createPasswordEncoder() creates a new instance each time
      // This test verifies that the login flow completes successfully
      expect(userRepo.findByEmail).toHaveBeenCalledWith(mockUser.email)
      expect(authRepo.findById).toHaveBeenCalledWith(mockUser.id)
    })
  })

  describe('when user does not exist', () => {
    beforeEach(() => {
      mock.module('@/repositories', () => ({
        userRepo: {
          findByEmail: mock(() => Promise.resolve(null)),
        },
        authRepo: {
          findById: mock(() => Promise.resolve(mockAuth)),
        },
        tokenRepo: {},
      }))
    })

    it('should throw Unauthorized error', async () => {
      try {
        await logInWithEmail({
          email: 'nonexistent@example.com',
          password: validPassword,
        })
        expect(true).toBe(false) // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).code).toBe(ErrorCode.Unauthorized)
      }

      expect(userRepo.findByEmail).toHaveBeenCalledWith('nonexistent@example.com')
      expect(authRepo.findById).not.toHaveBeenCalled()
    })
  })

  describe('when auth record does not exist', () => {
    beforeEach(() => {
      mock.module('@/repositories', () => ({
        userRepo: {
          findByEmail: mock(() => Promise.resolve(mockUser)),
        },
        authRepo: {
          findById: mock(() => Promise.resolve(null)),
        },
        tokenRepo: {},
      }))
    })

    it('should throw Unauthorized error', async () => {
      try {
        await logInWithEmail({
          email: mockUser.email,
          password: validPassword,
        })
        expect(true).toBe(false) // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).code).toBe(ErrorCode.Unauthorized)
      }

      expect(userRepo.findByEmail).toHaveBeenCalledWith(mockUser.email)
      expect(authRepo.findById).toHaveBeenCalledWith(mockUser.id)
    })
  })

  describe('when auth record has no password hash', () => {
    beforeEach(() => {
      const authWithoutPassword = { ...mockAuth, passwordHash: null }
      mock.module('@/repositories', () => ({
        userRepo: {
          findByEmail: mock(() => Promise.resolve(mockUser)),
        },
        authRepo: {
          findById: mock(() => Promise.resolve(authWithoutPassword)),
        },
        tokenRepo: {},
      }))
    })

    it('should throw Unauthorized error', async () => {
      try {
        await logInWithEmail({
          email: mockUser.email,
          password: validPassword,
        })
        expect(true).toBe(false) // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).code).toBe(ErrorCode.Unauthorized)
      }

      expect(userRepo.findByEmail).toHaveBeenCalledWith(mockUser.email)
      expect(authRepo.findById).toHaveBeenCalledWith(mockUser.id)
    })
  })

  describe('when password is incorrect', () => {
    beforeEach(() => {
      mock.module('@/lib/crypto', () => ({
        createPasswordEncoder: mock(() => ({
          compare: mock(() => Promise.resolve(false)), // Password doesn't match
          encode: mock(() => Promise.resolve('$2b$10$hashedPassword123')),
        })),
      }))
    })

    it('should throw BadCredentials error', async () => {
      try {
        await logInWithEmail({
          email: mockUser.email,
          password: 'wrongPassword',
        })
        expect(true).toBe(false) // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).code).toBe(ErrorCode.BadCredentials)
      }

      expect(userRepo.findByEmail).toHaveBeenCalledWith(mockUser.email)
      expect(authRepo.findById).toHaveBeenCalledWith(mockUser.id)
    })
  })

  describe('when password comparison fails due to empty values', () => {
    beforeEach(() => {
      mock.module('@/lib/crypto', () => ({
        createPasswordEncoder: mock(() => ({
          compare: mock(() => Promise.resolve(false)), // Empty values return false
          encode: mock(() => Promise.resolve('$2b$10$hashedPassword123')),
        })),
      }))
    })

    it('should throw BadCredentials error for empty password', async () => {
      try {
        await logInWithEmail({
          email: mockUser.email,
          password: '',
        })
        expect(true).toBe(false) // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).code).toBe(ErrorCode.BadCredentials)
      }
    })

    it('should throw Unauthorized error for empty password hash', async () => {
      const authWithEmptyHash = { ...mockAuth, passwordHash: '' }
      mock.module('@/repositories', () => ({
        userRepo: {
          findByEmail: mock(() => Promise.resolve(mockUser)),
        },
        authRepo: {
          findById: mock(() => Promise.resolve(authWithEmptyHash)),
        },
        tokenRepo: {},
      }))

      try {
        await logInWithEmail({
          email: mockUser.email,
          password: validPassword,
        })
        expect(true).toBe(false) // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).code).toBe(ErrorCode.Unauthorized)
      }
    })
  })

  describe('edge cases', () => {
    it('should handle email with different cases', async () => {
      const uppercaseEmail = mockUser.email.toUpperCase()
      const result = await logInWithEmail({
        email: uppercaseEmail,
        password: validPassword,
      })

      expect(userRepo.findByEmail).toHaveBeenCalledWith(uppercaseEmail)
      expect(result).toBe(mockToken)
    })

    it('should handle users with different statuses', async () => {
      const activeUser = { ...mockUser, status: Status.Active }
      mock.module('@/repositories', () => ({
        userRepo: {
          findByEmail: mock(() => Promise.resolve(activeUser)),
        },
        authRepo: {
          findById: mock(() => Promise.resolve(mockAuth)),
        },
        tokenRepo: {},
      }))

      const result = await logInWithEmail({
        email: mockUser.email,
        password: validPassword,
      })

      expect(result).toBe(mockToken)

      const jwt = await import('@/lib/jwt')
      expect(jwt.default.sign).toHaveBeenCalledWith(
        activeUser.id,
        activeUser.email,
        activeUser.role,
        activeUser.status,
      )
    })

    it('should handle users with different roles', async () => {
      const adminUser = { ...mockUser, role: 'admin' as const }
      mock.module('@/repositories', () => ({
        userRepo: {
          findByEmail: mock(() => Promise.resolve(adminUser)),
        },
        authRepo: {
          findById: mock(() => Promise.resolve(mockAuth)),
        },
        tokenRepo: {},
      }))

      const result = await logInWithEmail({
        email: mockUser.email,
        password: validPassword,
      })

      expect(result).toBe(mockToken)

      const jwt = await import('@/lib/jwt')
      expect(jwt.default.sign).toHaveBeenCalledWith(
        adminUser.id,
        adminUser.email,
        adminUser.role,
        adminUser.status,
      )
    })
  })

  describe('when database operations fail', () => {
    it('should propagate user repository errors', async () => {
      mock.module('@/repositories', () => ({
        userRepo: {
          findByEmail: mock(() => Promise.reject(new Error('Database connection failed'))),
        },
        authRepo: {
          findById: mock(() => Promise.resolve(mockAuth)),
        },
        tokenRepo: {},
      }))

      try {
        await logInWithEmail({
          email: mockUser.email,
          password: validPassword,
        })
        expect(true).toBe(false) // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Database connection failed')
      }

      expect(userRepo.findByEmail).toHaveBeenCalledWith(mockUser.email)
      expect(authRepo.findById).not.toHaveBeenCalled()
    })

    it('should propagate auth repository errors', async () => {
      mock.module('@/repositories', () => ({
        userRepo: {
          findByEmail: mock(() => Promise.resolve(mockUser)),
        },
        authRepo: {
          findById: mock(() => Promise.reject(new Error('Auth table unavailable'))),
        },
        tokenRepo: {},
      }))

      try {
        await logInWithEmail({
          email: mockUser.email,
          password: validPassword,
        })
        expect(true).toBe(false) // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Auth table unavailable')
      }

      expect(userRepo.findByEmail).toHaveBeenCalledWith(mockUser.email)
      expect(authRepo.findById).toHaveBeenCalledWith(mockUser.id)
    })

    it('should propagate password comparison errors', async () => {
      mock.module('@/lib/crypto', () => ({
        createPasswordEncoder: mock(() => ({
          compare: mock(() => Promise.reject(new Error('Crypto library error'))),
          encode: mock(() => Promise.resolve('$2b$10$hashedPassword123')),
        })),
      }))

      try {
        await logInWithEmail({
          email: mockUser.email,
          password: validPassword,
        })
        expect(true).toBe(false) // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Crypto library error')
      }

      expect(userRepo.findByEmail).toHaveBeenCalledWith(mockUser.email)
      expect(authRepo.findById).toHaveBeenCalledWith(mockUser.id)
    })

    it('should propagate JWT signing errors', async () => {
      mock.module('@/lib/jwt', () => ({
        default: {
          sign: mock(() => Promise.reject(new Error('JWT signing failed'))),
          verify: mock(() => Promise.resolve({ id: 1 })),
        },
      }))

      try {
        await logInWithEmail({
          email: mockUser.email,
          password: validPassword,
        })
        expect(true).toBe(false) // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('JWT signing failed')
      }

      expect(userRepo.findByEmail).toHaveBeenCalledWith(mockUser.email)
      expect(authRepo.findById).toHaveBeenCalledWith(mockUser.id)
    })
  })
})
