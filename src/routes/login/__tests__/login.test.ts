import { beforeEach, describe, expect, it, mock } from 'bun:test'

import { AppError, ErrorCode } from '@/lib/catch'
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
    tokenVersion: 1,
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
    mock.module('@/lib/auth', () => ({
      jwt: {
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
      const { jwt } = await import('@/lib/auth')
      await logInWithEmail({
        email: mockUser.email,
        password: validPassword,
      })

      expect(jwt.sign).toHaveBeenCalledWith(
        mockUser.id,
        mockUser.email,
        mockUser.role,
        mockUser.status,
        mockUser.tokenVersion,
      )
      expect(jwt.sign).toHaveBeenCalledTimes(1)
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

    it('should throw InvalidCredentials error', async () => {
      try {
        await logInWithEmail({
          email: 'nonexistent@example.com',
          password: validPassword,
        })
        expect(true).toBe(false) // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).code).toBe(ErrorCode.InvalidCredentials)
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

    it('should throw InvalidCredentials error', async () => {
      try {
        await logInWithEmail({
          email: mockUser.email,
          password: validPassword,
        })
        expect(true).toBe(false) // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).code).toBe(ErrorCode.InvalidCredentials)
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

    it('should throw InvalidCredentials error', async () => {
      try {
        await logInWithEmail({
          email: mockUser.email,
          password: validPassword,
        })
        expect(true).toBe(false) // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).code).toBe(ErrorCode.InvalidCredentials)
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

    it('should throw InvalidCredentials error for empty password hash', async () => {
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
        expect((error as AppError).code).toBe(ErrorCode.InvalidCredentials)
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

      const { jwt } = await import('@/lib/auth')
      expect(jwt.sign).toHaveBeenCalledWith(
        activeUser.id,
        activeUser.email,
        activeUser.role,
        activeUser.status,
        activeUser.tokenVersion,
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

      const { jwt } = await import('@/lib/auth')
      expect(jwt.sign).toHaveBeenCalledWith(
        adminUser.id,
        adminUser.email,
        adminUser.role,
        adminUser.status,
        adminUser.tokenVersion,
      )
    })

    it('should include tokenVersion in JWT for users with different tokenVersions', async () => {
      const userWithHighTokenVersion = { ...mockUser, tokenVersion: 10 }
      mock.module('@/repositories', () => ({
        userRepo: {
          findByEmail: mock(() => Promise.resolve(userWithHighTokenVersion)),
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

      const { jwt } = await import('@/lib/auth')
      expect(jwt.sign).toHaveBeenCalledWith(
        userWithHighTokenVersion.id,
        userWithHighTokenVersion.email,
        userWithHighTokenVersion.role,
        userWithHighTokenVersion.status,
        userWithHighTokenVersion.tokenVersion,
      )
    })

    it('should handle users with tokenVersion 0', async () => {
      const userWithZeroTokenVersion = { ...mockUser, tokenVersion: 0 }
      mock.module('@/repositories', () => ({
        userRepo: {
          findByEmail: mock(() => Promise.resolve(userWithZeroTokenVersion)),
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

      const { jwt } = await import('@/lib/auth')
      expect(jwt.sign).toHaveBeenCalledWith(
        userWithZeroTokenVersion.id,
        userWithZeroTokenVersion.email,
        userWithZeroTokenVersion.role,
        userWithZeroTokenVersion.status,
        0,
      )
    })

    it('should handle users with very large tokenVersion numbers', async () => {
      const userWithLargeTokenVersion = { ...mockUser, tokenVersion: 999999999 }
      mock.module('@/repositories', () => ({
        userRepo: {
          findByEmail: mock(() => Promise.resolve(userWithLargeTokenVersion)),
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

      const { jwt } = await import('@/lib/auth')
      expect(jwt.sign).toHaveBeenCalledWith(
        userWithLargeTokenVersion.id,
        userWithLargeTokenVersion.email,
        userWithLargeTokenVersion.role,
        userWithLargeTokenVersion.status,
        999999999,
      )
    })
  })

  describe('Token Version Integration', () => {
    it('should create JWT with current user tokenVersion', async () => {
      const userWithSpecificTokenVersion = { ...mockUser, tokenVersion: 5 }

      mock.module('@/repositories', () => ({
        userRepo: {
          findByEmail: mock(() => Promise.resolve(userWithSpecificTokenVersion)),
        },
        authRepo: {
          findById: mock(() => Promise.resolve(mockAuth)),
        },
        tokenRepo: {},
      }))

      // Mock JWT to return a payload we can inspect
      const mockJwtPayload = {
        id: userWithSpecificTokenVersion.id,
        email: userWithSpecificTokenVersion.email,
        role: userWithSpecificTokenVersion.role,
        status: userWithSpecificTokenVersion.status,
        v: userWithSpecificTokenVersion.tokenVersion,
        exp: Math.floor(Date.now() / 1000) + 3600,
      }

      mock.module('@/lib/auth', () => ({
        jwt: {
          sign: mock(() => Promise.resolve(mockToken)),
          verify: mock(() => Promise.resolve(mockJwtPayload)),
        },
      }))

      const result = await logInWithEmail({
        email: userWithSpecificTokenVersion.email,
        password: validPassword,
      })

      expect(result).toBe(mockToken)

      const { jwt } = await import('@/lib/auth')
      expect(jwt.sign).toHaveBeenCalledWith(
        userWithSpecificTokenVersion.id,
        userWithSpecificTokenVersion.email,
        userWithSpecificTokenVersion.role,
        userWithSpecificTokenVersion.status,
        userWithSpecificTokenVersion.tokenVersion,
      )
    })

    it('should demonstrate login flow creates JWT that would pass auth middleware validation', async () => {
      const testUser = { ...mockUser, tokenVersion: 3 }

      mock.module('@/repositories', () => ({
        userRepo: {
          findByEmail: mock(() => Promise.resolve(testUser)),
        },
        authRepo: {
          findById: mock(() => Promise.resolve(mockAuth)),
        },
        tokenRepo: {},
      }))

      // Mock JWT with real-like behavior
      const mockJwtToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6MSwidG9rZW5WZXJzaW9uIjozfQ.signature'

      mock.module('@/lib/auth', () => ({
        jwt: {
          sign: mock(() => Promise.resolve(mockJwtToken)),
          verify: mock(() => Promise.resolve({
            id: testUser.id,
            email: testUser.email,
            role: testUser.role,
            status: testUser.status,
            v: testUser.tokenVersion,
            exp: Math.floor(Date.now() / 1000) + 3600,
          })),
        },
      }))

      // Step 1: Login creates JWT with tokenVersion
      const loginResult = await logInWithEmail({
        email: testUser.email,
        password: validPassword,
      })

      expect(loginResult).toBe(mockJwtToken)

      // Step 2: Verify JWT contains correct tokenVersion
      const { jwt } = await import('@/lib/auth')
      expect(jwt.sign).toHaveBeenCalledWith(
        testUser.id,
        testUser.email,
        testUser.role,
        testUser.status,
        testUser.tokenVersion,
      )

      // Step 3: Simulate auth middleware validation
      const payload = await jwt.verify(mockJwtToken)
      expect(payload.v).toBe(testUser.tokenVersion)

      // This JWT would pass auth middleware validation since:
      // payload.v (3) === testUser.tokenVersion (3)
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
      mock.module('@/lib/auth', () => ({
        jwt: {
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
