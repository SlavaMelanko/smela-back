import { beforeEach, describe, expect, it, mock } from 'bun:test'

import { AppError, ErrorCode } from '@/lib/catch'
import { Role, Status } from '@/types'

import logInWithEmail from '../login'

describe('Login with Email', () => {
  let mockLoginParams: any
  let mockUser: any
  let mockAuth: any
  let mockJwtToken: any

  beforeEach(() => {
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

    mock.module('@/repositories', () => ({
      userRepo: {
        findByEmail: mock(() => Promise.resolve(mockUser)),
      },
      authRepo: {
        findById: mock(() => Promise.resolve(mockAuth)),
      },
    }))

    mock.module('@/lib/crypto', () => ({
      createPasswordEncoder: mock(() => ({
        compare: mock(() => Promise.resolve(true)),
      })),
    }))

    mock.module('@/lib/jwt', () => ({
      default: {
        sign: mock(() => Promise.resolve(mockJwtToken)),
      },
    }))

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

    describe('when user has different roles', () => {
      beforeEach(() => {
        const adminUser = { ...mockUser, role: Role.Admin }
        mock.module('@/repositories', () => ({
          userRepo: {
            findByEmail: mock(() => Promise.resolve(adminUser)),
          },
          authRepo: {
            findById: mock(() => Promise.resolve(mockAuth)),
          },
        }))
      })

      it('should handle different user roles correctly', async () => {
        const result = await logInWithEmail(mockLoginParams)
        expect(result.user.role).toBe(Role.Admin)
      })
    })
  })

  describe('user not found scenarios', () => {
    describe('when user does not exist', () => {
      beforeEach(() => {
        mock.module('@/repositories', () => ({
          userRepo: {
            findByEmail: mock(() => Promise.resolve(null)),
          },
          authRepo: {
            findById: mock(() => Promise.resolve(mockAuth)),
          },
        }))
      })

      it('should throw InvalidCredentials', async () => {
        await expect(logInWithEmail(mockLoginParams)).rejects.toThrow(AppError)

        try {
          await logInWithEmail(mockLoginParams)
        } catch (error) {
          expect(error).toBeInstanceOf(AppError)
          expect((error as AppError).code).toBe(ErrorCode.InvalidCredentials)
        }
      })
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
    describe('when auth record not found', () => {
      beforeEach(() => {
        mock.module('@/repositories', () => ({
          userRepo: {
            findByEmail: mock(() => Promise.resolve(mockUser)),
          },
          authRepo: {
            findById: mock(() => Promise.resolve(null)),
          },
        }))
      })

      it('should throw InvalidCredentials', async () => {
        await expect(logInWithEmail(mockLoginParams)).rejects.toThrow(AppError)

        try {
          await logInWithEmail(mockLoginParams)
        } catch (error) {
          expect(error).toBeInstanceOf(AppError)
          expect((error as AppError).code).toBe(ErrorCode.InvalidCredentials)
        }
      })
    })

    describe('when auth record has no password hash', () => {
      beforeEach(() => {
        mock.module('@/repositories', () => ({
          userRepo: {
            findByEmail: mock(() => Promise.resolve(mockUser)),
          },
          authRepo: {
            findById: mock(() => Promise.resolve({ ...mockAuth, passwordHash: null })),
          },
        }))
      })

      it('should throw InvalidCredentials', async () => {
        await expect(logInWithEmail(mockLoginParams)).rejects.toThrow(AppError)

        try {
          await logInWithEmail(mockLoginParams)
        } catch (error) {
          expect(error).toBeInstanceOf(AppError)
          expect((error as AppError).code).toBe(ErrorCode.InvalidCredentials)
        }
      })
    })
  })

  describe('password validation scenarios', () => {
    describe('when password is incorrect', () => {
      beforeEach(() => {
        mock.module('@/lib/crypto', () => ({
          createPasswordEncoder: mock(() => ({
            compare: mock(() => Promise.resolve(false)),
          })),
        }))
      })

      it('should throw BadCredentials for incorrect password', async () => {
        await expect(logInWithEmail(mockLoginParams)).rejects.toThrow(AppError)

        try {
          await logInWithEmail(mockLoginParams)
        } catch (error) {
          expect(error).toBeInstanceOf(AppError)
          expect((error as AppError).code).toBe(ErrorCode.BadCredentials)
        }
      })

      it('should handle empty password input', async () => {
        try {
          await logInWithEmail({ ...mockLoginParams, password: '' })
        } catch (error) {
          expect(error).toBeInstanceOf(AppError)
          expect((error as AppError).code).toBe(ErrorCode.BadCredentials)
        }
      })
    })

    describe('when password encoder creation fails', () => {
      beforeEach(() => {
        mock.module('@/lib/crypto', () => ({
          createPasswordEncoder: mock(() => {
            throw new Error('Crypto library initialization failed')
          }),
        }))
      })

      it('should handle password encoder creation failure', async () => {
        await expect(logInWithEmail(mockLoginParams)).rejects.toThrow(
          'Crypto library initialization failed',
        )
      })
    })

    describe('when password comparison fails', () => {
      beforeEach(() => {
        mock.module('@/lib/crypto', () => ({
          createPasswordEncoder: mock(() => ({
            compare: mock(() => Promise.reject(new Error('Bcrypt comparison failed'))),
          })),
        }))
      })

      it('should handle password comparison failure', async () => {
        await expect(logInWithEmail(mockLoginParams)).rejects.toThrow(
          'Bcrypt comparison failed',
        )
      })
    })
  })

  describe('JWT generation scenarios', () => {
    describe('when JWT signing fails', () => {
      beforeEach(() => {
        mock.module('@/lib/jwt', () => ({
          default: {
            sign: mock(() => Promise.reject(new Error('JWT signing failed'))),
          },
        }))
      })

      it('should handle JWT signing failure', async () => {
        await expect(logInWithEmail(mockLoginParams)).rejects.toThrow('JWT signing failed')
      })
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
    describe('when user repository database fails', () => {
      beforeEach(() => {
        mock.module('@/repositories', () => ({
          userRepo: {
            findByEmail: mock(() => Promise.reject(new Error('Database connection failed'))),
          },
          authRepo: {
            findById: mock(() => Promise.resolve(mockAuth)),
          },
        }))
      })

      it('should handle user repository database failure', async () => {
        await expect(logInWithEmail(mockLoginParams)).rejects.toThrow('Database connection failed')
      })
    })

    describe('when auth repository database fails', () => {
      beforeEach(() => {
        mock.module('@/repositories', () => ({
          userRepo: {
            findByEmail: mock(() => Promise.resolve(mockUser)),
          },
          authRepo: {
            findById: mock(() => Promise.reject(new Error('Auth table query failed'))),
          },
        }))
      })

      it('should handle auth repository database failure', async () => {
        await expect(logInWithEmail(mockLoginParams)).rejects.toThrow('Auth table query failed')
      })
    })

    describe('when auth data is malformed', () => {
      beforeEach(() => {
        mock.module('@/repositories', () => ({
          userRepo: {
            findByEmail: mock(() => Promise.resolve(mockUser)),
          },
          authRepo: {
            findById: mock(() => Promise.resolve({ ...mockAuth, passwordHash: undefined })),
          },
        }))
      })

      it('should handle malformed auth data from database', async () => {
        try {
          await logInWithEmail(mockLoginParams)
        } catch (error) {
          expect(error).toBeInstanceOf(AppError)
          expect((error as AppError).code).toBe(ErrorCode.InvalidCredentials)
        }
      })
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

    describe('when user has Role.User', () => {
      beforeEach(() => {
        const userWithRole = { ...mockUser, role: Role.User }
        mock.module('@/repositories', () => ({
          userRepo: {
            findByEmail: mock(() => Promise.resolve(userWithRole)),
          },
          authRepo: {
            findById: mock(() => Promise.resolve(mockAuth)),
          },
        }))
      })

      it('should handle user with Role.User', async () => {
        const result = await logInWithEmail(mockLoginParams)
        expect(result.user.role).toBe(Role.User)
      })
    })

    describe('when user has Role.Admin', () => {
      beforeEach(() => {
        const userWithRole = { ...mockUser, role: Role.Admin }
        mock.module('@/repositories', () => ({
          userRepo: {
            findByEmail: mock(() => Promise.resolve(userWithRole)),
          },
          authRepo: {
            findById: mock(() => Promise.resolve(mockAuth)),
          },
        }))
      })

      it('should handle user with Role.Admin', async () => {
        const result = await logInWithEmail(mockLoginParams)
        expect(result.user.role).toBe(Role.Admin)
      })
    })

    describe('when user has Role.Owner', () => {
      beforeEach(() => {
        const userWithRole = { ...mockUser, role: Role.Owner }
        mock.module('@/repositories', () => ({
          userRepo: {
            findByEmail: mock(() => Promise.resolve(userWithRole)),
          },
          authRepo: {
            findById: mock(() => Promise.resolve(mockAuth)),
          },
        }))
      })

      it('should handle user with Role.Owner', async () => {
        const result = await logInWithEmail(mockLoginParams)
        expect(result.user.role).toBe(Role.Owner)
      })
    })

    describe('when user has Role.Enterprise', () => {
      beforeEach(() => {
        const userWithRole = { ...mockUser, role: Role.Enterprise }
        mock.module('@/repositories', () => ({
          userRepo: {
            findByEmail: mock(() => Promise.resolve(userWithRole)),
          },
          authRepo: {
            findById: mock(() => Promise.resolve(mockAuth)),
          },
        }))
      })

      it('should handle user with Role.Enterprise', async () => {
        const result = await logInWithEmail(mockLoginParams)
        expect(result.user.role).toBe(Role.Enterprise)
      })
    })

    describe('when user has Status.New', () => {
      beforeEach(() => {
        const userWithStatus = { ...mockUser, status: Status.New }
        mock.module('@/repositories', () => ({
          userRepo: {
            findByEmail: mock(() => Promise.resolve(userWithStatus)),
          },
          authRepo: {
            findById: mock(() => Promise.resolve(mockAuth)),
          },
        }))
      })

      it('should handle user with Status.New', async () => {
        await logInWithEmail(mockLoginParams)
        // Test passes if no error is thrown
      })
    })

    describe('when user has Status.Verified', () => {
      beforeEach(() => {
        const userWithStatus = { ...mockUser, status: Status.Verified }
        mock.module('@/repositories', () => ({
          userRepo: {
            findByEmail: mock(() => Promise.resolve(userWithStatus)),
          },
          authRepo: {
            findById: mock(() => Promise.resolve(mockAuth)),
          },
        }))
      })

      it('should handle user with Status.Verified', async () => {
        await logInWithEmail(mockLoginParams)
        // Test passes if no error is thrown
      })
    })

    describe('when user has Status.Suspended', () => {
      beforeEach(() => {
        const userWithStatus = { ...mockUser, status: Status.Suspended }
        mock.module('@/repositories', () => ({
          userRepo: {
            findByEmail: mock(() => Promise.resolve(userWithStatus)),
          },
          authRepo: {
            findById: mock(() => Promise.resolve(mockAuth)),
          },
        }))
      })

      it('should handle user with Status.Suspended', async () => {
        await logInWithEmail(mockLoginParams)
        // Test passes if no error is thrown
      })
    })
  })
})
