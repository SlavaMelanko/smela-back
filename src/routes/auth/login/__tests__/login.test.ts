import { afterAll, beforeAll, beforeEach, describe, expect, it, mock } from 'bun:test'

import { AppError, ErrorCode } from '@/lib/catch'
import { Role, Status } from '@/types'

import logInWithEmail from '../login'

describe('logInWithEmail', () => {
  beforeAll(() => {
    mock.restore()
  })

  const mockLoginParams = {
    email: 'test@example.com',
    password: 'ValidPass123!',
  }

  const mockUser = {
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

  const mockAuth = {
    userId: 1,
    provider: 'local',
    identifier: 'test@example.com',
    passwordHash: '$2b$10$hashedPassword123',
  }

  const mockJwtToken = 'mock-jwt-token-123'

  beforeEach(() => {
    // Mock repositories
    mock.module('@/repositories', () => ({
      userRepo: {
        findByEmail: mock(() => Promise.resolve(mockUser)),
      },
      authRepo: {
        findById: mock(() => Promise.resolve(mockAuth)),
      },
    }))

    // Mock crypto password encoder
    mock.module('@/lib/crypto', () => ({
      createPasswordEncoder: mock(() => ({
        compare: mock(() => Promise.resolve(true)),
      })),
    }))

    // Mock JWT signing
    mock.module('@/lib/jwt', () => ({
      default: {
        sign: mock(() => Promise.resolve(mockJwtToken)),
      },
    }))

    // Mock user normalization
    mock.module('@/lib/user', () => ({
      normalizeUser: mock((user) => {
        const { tokenVersion, ...normalizedUser } = user

        return normalizedUser
      }),
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

      mock.module('@/repositories', () => ({
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
      mock.module('@/repositories', () => ({
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
      mock.module('@/repositories', () => ({
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
      mock.module('@/repositories', () => ({
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
      mock.module('@/lib/crypto', () => ({
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
      mock.module('@/lib/crypto', () => ({
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
      mock.module('@/lib/crypto', () => ({
        createPasswordEncoder: mock(() => {
          throw new Error('Crypto library initialization failed')
        }),
      }))

      await expect(logInWithEmail(mockLoginParams)).rejects.toThrow(
        'Crypto library initialization failed',
      )
    })

    it('should handle password comparison failure', async () => {
      mock.module('@/lib/crypto', () => ({
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
      mock.module('@/lib/jwt', () => ({
        default: {
          sign: mock(() => Promise.reject(new Error('JWT signing failed'))),
        },
      }))

      await expect(logInWithEmail(mockLoginParams)).rejects.toThrow('JWT signing failed')
    })
  })

  describe('edge cases and boundary conditions', () => {
    it('should handle very long email addresses', async () => {
      const longEmail = `${'a'.repeat(100)}@example.com`

      const result = await logInWithEmail({ ...mockLoginParams, email: longEmail })
      expect(result).toHaveProperty('user')
      expect(result).toHaveProperty('token')
    })

    it('should handle very long passwords', async () => {
      const longPassword = 'a'.repeat(1000)

      const result = await logInWithEmail({ ...mockLoginParams, password: longPassword })
      expect(result).toHaveProperty('user')
      expect(result).toHaveProperty('token')
    })

    it('should handle special characters in email', async () => {
      const specialEmail = 'test+tag@example-domain.co.uk'

      const result = await logInWithEmail({ ...mockLoginParams, email: specialEmail })
      expect(result).toHaveProperty('user')
      expect(result).toHaveProperty('token')
    })

    it('should handle special characters in password', async () => {
      const specialPassword = '!@#$%^&*()_+-=[]{}|;:,.<>?'

      const result = await logInWithEmail({ ...mockLoginParams, password: specialPassword })
      expect(result).toHaveProperty('user')
      expect(result).toHaveProperty('token')
    })

    it('should handle Unicode characters in password', async () => {
      const unicodePassword = '密码123é🔑'

      const result = await logInWithEmail({ ...mockLoginParams, password: unicodePassword })
      expect(result).toHaveProperty('user')
      expect(result).toHaveProperty('token')
    })
  })

  describe('repository error scenarios', () => {
    it('should handle user repository database failure', async () => {
      mock.module('@/repositories', () => ({
        userRepo: {
          findByEmail: mock(() => Promise.reject(new Error('Database connection failed'))),
        },
        authRepo: {
          findById: mock(() => Promise.resolve(mockAuth)),
        },
      }))

      await expect(logInWithEmail(mockLoginParams)).rejects.toThrow('Database connection failed')
    })

    it('should handle auth repository database failure', async () => {
      mock.module('@/repositories', () => ({
        userRepo: {
          findByEmail: mock(() => Promise.resolve(mockUser)),
        },
        authRepo: {
          findById: mock(() => Promise.reject(new Error('Auth table query failed'))),
        },
      }))

      await expect(logInWithEmail(mockLoginParams)).rejects.toThrow('Auth table query failed')
    })

    it('should handle malformed auth data from database', async () => {
      mock.module('@/repositories', () => ({
        userRepo: {
          findByEmail: mock(() => Promise.resolve(mockUser)),
        },
        authRepo: {
          findById: mock(() => Promise.resolve({ ...mockAuth, passwordHash: undefined })),
        },
      }))

      try {
        await logInWithEmail(mockLoginParams)
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
        mock.module('@/repositories', () => ({
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
        mock.module('@/repositories', () => ({
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

  afterAll(() => {
    mock.restore()
  })
})
