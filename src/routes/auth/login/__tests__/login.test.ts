import { beforeEach, describe, expect, it, mock } from 'bun:test'

import { AppError, ErrorCode } from '@/lib/catch'
import { Role, Status } from '@/types'

import logInWithEmail from '../login'

describe('Login with Email', () => {
  let mockLoginParams: any
  let mockUser: any
  let mockAuth: any
  let mockJwtToken: any

  // Configurable mock references
  let mockFindByEmail: any
  let mockFindById: any
  let mockPasswordCompare: any
  let mockJwtSign: any
  let mockNormalizeUser: any

  beforeEach(async () => {
    mockLoginParams = {
      email: 'test@example.com',
      password: 'ValidPass123!',
    }

    mockUser = {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'test@example.com',
      status: Status.Verified,
      role: Role.User,
      tokenVersion: 1,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    }

    mockAuth = {
      userId: 1,
      provider: 'local',
      identifier: 'test@example.com',
      passwordHash: '$2b$10$hashedPassword123',
    }

    mockJwtToken = 'login-jwt-token-123'

    // Initialize configurable mock references
    mockFindByEmail = mock(() => Promise.resolve(mockUser))
    mockFindById = mock(() => Promise.resolve(mockAuth))
    mockPasswordCompare = mock(() => Promise.resolve(true))
    mockJwtSign = mock(() => Promise.resolve(mockJwtToken))
    mockNormalizeUser = mock((user) => {
      const { tokenVersion, ...normalizedUser } = user

      return normalizedUser
    })

    await mock.module('@/repositories', () => ({
      userRepo: {
        findByEmail: mockFindByEmail,
      },
      authRepo: {
        findById: mockFindById,
      },
    }))

    await mock.module('@/lib/crypto', () => ({
      createPasswordEncoder: mock(() => ({
        compare: mockPasswordCompare,
      })),
    }))

    await mock.module('@/lib/jwt', () => ({
      default: {
        sign: mockJwtSign,
      },
    }))

    await mock.module('@/lib/user', () => ({
      normalizeUser: mockNormalizeUser,
    }))
  })

  describe('successful login', () => {
    it('should return user and token for valid credentials', async () => {
      const result = await logInWithEmail(mockLoginParams)

      expect(result).toHaveProperty('user')
      expect(result).toHaveProperty('token')
      expect(result.token).toBe(mockJwtToken)
      expect(result.user).not.toHaveProperty('tokenVersion')
      expect(result.user.email).toBe(mockLoginParams.email)
    })

    it('should handle different user roles correctly', async () => {
      const adminUser = { ...mockUser, role: Role.Admin }

      await mock.module('@/repositories', () => ({
        userRepo: {
          findByEmail: mock(() => Promise.resolve(adminUser)),
        },
        authRepo: {
          findById: mock(() => Promise.resolve(mockAuth)),
        },
      }))

      const result = await logInWithEmail(mockLoginParams)
      expect(result.user.role).toBe(Role.Admin)
    })
  })

  describe('user not found scenarios', () => {
    it('should throw InvalidCredentials when user does not exist', async () => {
      await mock.module('@/repositories', () => ({
        userRepo: {
          findByEmail: mock(() => Promise.resolve(null)),
        },
        authRepo: {
          findById: mock(() => Promise.resolve(mockAuth)),
        },
      }))

      await expect(logInWithEmail(mockLoginParams)).rejects.toThrow(AppError)

      try {
        await logInWithEmail(mockLoginParams)
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).code).toBe(ErrorCode.InvalidCredentials)
      }
    })

    it('should handle case-sensitive email lookup', async () => {
      const upperCaseEmail = mockLoginParams.email.toUpperCase()

      // Should still work with different case
      const result = await logInWithEmail({ ...mockLoginParams, email: upperCaseEmail })
      expect(result).toHaveProperty('user')
      expect(result).toHaveProperty('token')
    })
  })

  describe('auth record scenarios', () => {
    it('should throw InvalidCredentials when auth record not found', async () => {
      await mock.module('@/repositories', () => ({
        userRepo: {
          findByEmail: mock(() => Promise.resolve(mockUser)),
        },
        authRepo: {
          findById: mock(() => Promise.resolve(null)),
        },
      }))

      await expect(logInWithEmail(mockLoginParams)).rejects.toThrow(AppError)

      try {
        await logInWithEmail(mockLoginParams)
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).code).toBe(ErrorCode.InvalidCredentials)
      }
    })

    it('should throw InvalidCredentials when auth record has no password hash', async () => {
      await mock.module('@/repositories', () => ({
        userRepo: {
          findByEmail: mock(() => Promise.resolve(mockUser)),
        },
        authRepo: {
          findById: mock(() => Promise.resolve({ ...mockAuth, passwordHash: null })),
        },
      }))

      await expect(logInWithEmail(mockLoginParams)).rejects.toThrow(AppError)

      try {
        await logInWithEmail(mockLoginParams)
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).code).toBe(ErrorCode.InvalidCredentials)
      }
    })
  })

  describe('password validation scenarios', () => {
    it('should throw BadCredentials for incorrect password', async () => {
      await mock.module('@/lib/crypto', () => ({
        createPasswordEncoder: mock(() => ({
          compare: mock(() => Promise.resolve(false)),
        })),
      }))

      await expect(logInWithEmail(mockLoginParams)).rejects.toThrow(AppError)

      try {
        await logInWithEmail(mockLoginParams)
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).code).toBe(ErrorCode.BadCredentials)
      }
    })

    it('should handle empty password input', async () => {
      await mock.module('@/lib/crypto', () => ({
        createPasswordEncoder: mock(() => ({
          compare: mock(() => Promise.resolve(false)),
        })),
      }))

      try {
        await logInWithEmail({ ...mockLoginParams, password: '' })
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).code).toBe(ErrorCode.BadCredentials)
      }
    })

    it('should handle password encoder creation failure', async () => {
      await mock.module('@/lib/crypto', () => ({
        createPasswordEncoder: mock(() => {
          throw new Error('Crypto library initialization failed')
        }),
      }))

      await expect(logInWithEmail(mockLoginParams)).rejects.toThrow(
        'Crypto library initialization failed',
      )
    })

    it('should handle password comparison failure', async () => {
      await mock.module('@/lib/crypto', () => ({
        createPasswordEncoder: mock(() => ({
          compare: mock(() => Promise.reject(new Error('Bcrypt comparison failed'))),
        })),
      }))

      await expect(logInWithEmail(mockLoginParams)).rejects.toThrow(
        'Bcrypt comparison failed',
      )
    })
  })

  describe('JWT generation scenarios', () => {
    it('should handle JWT signing failure', async () => {
      await mock.module('@/lib/jwt', () => ({
        default: {
          sign: mock(() => Promise.reject(new Error('JWT signing failed'))),
        },
      }))

      await expect(logInWithEmail(mockLoginParams)).rejects.toThrow('JWT signing failed')
    })
  })

  describe('edge cases and boundary conditions', () => {
    const testCases = [
      {
        name: 'very long email addresses',
        params: { email: `${'a'.repeat(100)}@example.com` },
      },
      {
        name: 'very long passwords',
        params: { password: 'a'.repeat(1000) },
      },
      {
        name: 'special characters in email',
        params: { email: 'test+tag@example-domain.co.uk' },
      },
      {
        name: 'special characters in password',
        params: { password: '!@#$%^&*()_+-=[]{}|;:,.<>?' },
      },
      {
        name: 'Unicode characters in password',
        params: { password: '密码123é🔑' },
      },
    ]

    testCases.forEach(({ name, params }) => {
      it(`should handle ${name}`, async () => {
        const result = await logInWithEmail({ ...mockLoginParams, ...params })
        expect(result).toHaveProperty('user')
        expect(result).toHaveProperty('token')
      })
    })
  })

  describe('repository error scenarios', () => {
    it('should handle user repository database failure', async () => {
      await mock.module('@/repositories', () => ({
        userRepo: {
          findByEmail: mock(() => Promise.reject(new Error('Database connection failed'))),
        },
        authRepo: {
          findById: mock(() => Promise.resolve(mockAuth)),
        },
      }))

      try {
        await logInWithEmail(mockLoginParams)
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Database connection failed')
      }
    })

    it('should handle auth repository database failure', async () => {
      await mock.module('@/repositories', () => ({
        userRepo: {
          findByEmail: mock(() => Promise.resolve(mockUser)),
        },
        authRepo: {
          findById: mock(() => Promise.reject(new Error('Auth table query failed'))),
        },
      }))

      try {
        await logInWithEmail(mockLoginParams)
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Auth table query failed')
      }
    })

    it('should handle malformed auth data from database', async () => {
      await mock.module('@/repositories', () => ({
        userRepo: {
          findByEmail: mock(() => Promise.resolve(mockUser)),
        },
        authRepo: {
          findById: mock(() => Promise.resolve({ ...mockAuth, passwordHash: undefined })),
        },
      }))

      try {
        await logInWithEmail(mockLoginParams)
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).code).toBe(ErrorCode.InvalidCredentials)
      }
    })
  })

  describe('data consistency and normalization', () => {
    it('should ensure user normalization removes sensitive fields', async () => {
      const result = await logInWithEmail(mockLoginParams)

      expect(result.user).not.toHaveProperty('tokenVersion')
      expect(result.user).toHaveProperty('id')
      expect(result.user).toHaveProperty('email')
      expect(result.user).toHaveProperty('firstName')
      expect(result.user).toHaveProperty('lastName')
      expect(result.user).toHaveProperty('role')
      expect(result.user).toHaveProperty('status')
    })

    it('should handle user with all possible roles', async () => {
      const roles = [Role.User, Role.Admin, Role.Owner, Role.Enterprise]

      for (const role of roles) {
        const userWithRole = { ...mockUser, role }
        await mock.module('@/repositories', () => ({
          userRepo: {
            findByEmail: mock(() => Promise.resolve(userWithRole)),
          },
          authRepo: {
            findById: mock(() => Promise.resolve(mockAuth)),
          },
        }))

        const result = await logInWithEmail(mockLoginParams)
        expect(result.user.role).toBe(role)
      }
    })

    it('should handle user with all possible statuses', async () => {
      const statuses = [Status.New, Status.Verified, Status.Suspended]

      for (const status of statuses) {
        const userWithStatus = { ...mockUser, status }
        await mock.module('@/repositories', () => ({
          userRepo: {
            findByEmail: mock(() => Promise.resolve(userWithStatus)),
          },
          authRepo: {
            findById: mock(() => Promise.resolve(mockAuth)),
          },
        }))

        await logInWithEmail(mockLoginParams)
        // Test passes if no error is thrown
      }
    })
  })
})
