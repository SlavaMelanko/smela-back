import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import { ModuleMocker } from '@/__tests__/module-mocker'
import db from '@/db'
import { AppError, ErrorCode } from '@/lib/catch'
import { emailAgent } from '@/lib/email-agent'
import { userRepo } from '@/repositories'
import { createAuth } from '@/repositories/auth/queries'
import { createToken, deprecateOldTokens } from '@/repositories/token/queries'
import { createUser } from '@/repositories/user/queries'
import { AuthProvider, Role, Status, Token } from '@/types'

import signUpWithEmail from '../signup'

describe('Signup with Email', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  const mockSignupParams = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    password: 'ValidPass123!',
  }

  const mockNewUser = {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    status: Status.New,
    role: Role.User,
    tokenVersion: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockHashedPassword = '$2b$10$hashedPassword123'
  const mockToken = 'verification-token-123'
  const mockExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours

  beforeEach(async () => {
    await moduleMocker.mock('@/repositories', () => ({
      userRepo: {
        findByEmail: mock(() => Promise.resolve(null)),
      },
    }))

    // Mock the db.transaction method
    await moduleMocker.mock('@/db', () => ({
      default: {
        transaction: mock(async (callback: any) => {
          // Execute the callback with a mock transaction object
          return await callback({
            insert: mock(() => ({
              values: mock(() => ({
                returning: mock(() => Promise.resolve([mockNewUser])),
              })),
            })),
            update: mock(() => ({
              set: mock(() => ({
                where: mock(() => Promise.resolve()),
              })),
            })),
          })
        }),
      },
    }))

    await moduleMocker.mock('@/repositories/user/queries', () => ({
      createUser: mock(() => Promise.resolve(mockNewUser)),
      findUserByEmail: mock(() => Promise.resolve(null)),
    }))

    await moduleMocker.mock('@/repositories/auth/queries', () => ({
      createAuth: mock(() => Promise.resolve(1)),
    }))

    await moduleMocker.mock('@/repositories/token/queries', () => ({
      deprecateOldTokens: mock(() => Promise.resolve()),
      createToken: mock(() => Promise.resolve(1)),
    }))

    await moduleMocker.mock('@/lib/crypto', () => ({
      createPasswordEncoder: mock(() => ({
        hash: mock(() => Promise.resolve(mockHashedPassword)),
        compare: mock(() => Promise.resolve(true)),
      })),
    }))

    await moduleMocker.mock('@/lib/token', () => ({
      generateToken: mock(() => ({
        type: Token.EmailVerification,
        token: mockToken,
        expiresAt: mockExpiresAt,
      })),
      EMAIL_VERIFICATION_EXPIRY_HOURS: 48,
    }))

    await moduleMocker.mock('@/lib/email-agent', () => ({
      emailAgent: {
        sendWelcomeEmail: mock(() => Promise.resolve()),
      },
    }))

    await moduleMocker.mock('@/lib/jwt', () => ({
      default: {
        sign: mock(() => Promise.resolve('mock-signup-jwt-token')),
      },
    }))
  })

  afterEach(() => {
    moduleMocker.clear()
  })

  describe('when signup is successful', () => {
    it('should create a new user with correct data', async () => {
      const result = await signUpWithEmail(mockSignupParams)

      expect(db.transaction).toHaveBeenCalledTimes(1)
      expect(createUser).toHaveBeenCalledWith(
        {
          firstName: mockSignupParams.firstName,
          lastName: mockSignupParams.lastName,
          email: mockSignupParams.email,
          role: Role.User,
          status: Status.New,
        },
        expect.anything(), // transaction object
      )
      expect(createUser).toHaveBeenCalledTimes(1)
      const { tokenVersion, ...expectedUser } = mockNewUser
      expect(result.user).toEqual(expectedUser)
      expect(result).toHaveProperty('token')
      expect(result.token).toBe('mock-signup-jwt-token')
    })

    it('should create auth record with hashed password', async () => {
      await signUpWithEmail(mockSignupParams)

      expect(createAuth).toHaveBeenCalledWith(
        {
          userId: mockNewUser.id,
          provider: AuthProvider.Local,
          identifier: mockSignupParams.email,
          passwordHash: mockHashedPassword,
        },
        expect.anything(), // transaction object
      )
      expect(createAuth).toHaveBeenCalledTimes(1)
    })

    it('should hash the password correctly', async () => {
      await signUpWithEmail(mockSignupParams)

      // Note: We can't easily test the internal encoder.hash call
      // because createPasswordEncoder() creates a new instance each time
      // This test verifies that the signup flow completes successfully
      expect(userRepo.findByEmail).toHaveBeenCalledWith(mockSignupParams.email)
      expect(createUser).toHaveBeenCalledTimes(1)
      expect(createAuth).toHaveBeenCalledWith(
        {
          userId: mockNewUser.id,
          provider: AuthProvider.Local,
          identifier: mockSignupParams.email,
          passwordHash: mockHashedPassword,
        },
        expect.anything(), // transaction object
      )
    })

    it('should create email verification token', async () => {
      await signUpWithEmail(mockSignupParams)

      expect(deprecateOldTokens).toHaveBeenCalledWith(
        mockNewUser.id,
        Token.EmailVerification,
        expect.anything(), // transaction object
      )
      expect(deprecateOldTokens).toHaveBeenCalledTimes(1)

      expect(createToken).toHaveBeenCalledWith(
        {
          userId: mockNewUser.id,
          type: Token.EmailVerification,
          token: mockToken,
          expiresAt: mockExpiresAt,
        },
        expect.anything(), // transaction object
      )
      expect(createToken).toHaveBeenCalledTimes(1)
    })

    it('should send welcome email with verification token', async () => {
      await signUpWithEmail(mockSignupParams)

      expect(emailAgent.sendWelcomeEmail).toHaveBeenCalledWith({
        firstName: mockNewUser.firstName,
        email: mockNewUser.email,
        token: mockToken,
      })
      expect(emailAgent.sendWelcomeEmail).toHaveBeenCalledTimes(1)
    })

    it('should generate JWT token for immediate authentication', async () => {
      const result = await signUpWithEmail(mockSignupParams)

      expect(result).toHaveProperty('token')
      expect(result.token).toBe('mock-signup-jwt-token')
      expect(result).toHaveProperty('user')
    })

    it('should not return sensitive fields in the response', async () => {
      const result = await signUpWithEmail(mockSignupParams)

      // Ensure tokenVersion is not included in the response
      expect(result.user).not.toHaveProperty('tokenVersion')
      // createdAt and updatedAt are now included in the response
      expect(result.user).toHaveProperty('createdAt')
      expect(result.user).toHaveProperty('updatedAt')

      // Ensure expected fields are present
      expect(result.user).toHaveProperty('id')
      expect(result.user).toHaveProperty('firstName')
      expect(result.user).toHaveProperty('lastName')
      expect(result.user).toHaveProperty('email')
      expect(result.user).toHaveProperty('status')
      expect(result.user).toHaveProperty('role')
    })

    it('should check for existing user first', async () => {
      await signUpWithEmail(mockSignupParams)

      expect(userRepo.findByEmail).toHaveBeenCalledWith(mockSignupParams.email)
      expect(userRepo.findByEmail).toHaveBeenCalledTimes(1)
    })
  })

  describe('when email is already in use', () => {
    beforeEach(async () => {
      const existingUser = {
        id: 2,
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'john@example.com',
        status: Status.Verified,
        role: Role.User,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      await moduleMocker.mock('@/repositories', () => ({
        userRepo: {
          findByEmail: mock(() => Promise.resolve(existingUser)),
        },
      }))
    })

    it('should throw EmailAlreadyInUse error', async () => {
      try {
        await signUpWithEmail(mockSignupParams)
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).code).toBe(ErrorCode.EmailAlreadyInUse)
      }

      expect(userRepo.findByEmail).toHaveBeenCalledWith(mockSignupParams.email)
      expect(db.transaction).not.toHaveBeenCalled()
      expect(createUser).not.toHaveBeenCalled()
      expect(createAuth).not.toHaveBeenCalled()
      expect(deprecateOldTokens).not.toHaveBeenCalled()
      expect(createToken).not.toHaveBeenCalled()
      expect(emailAgent.sendWelcomeEmail).not.toHaveBeenCalled()
    })
  })

  describe('when user creation fails', () => {
    beforeEach(async () => {
      await moduleMocker.mock('@/repositories/user/queries', () => ({
        createUser: mock(() => Promise.reject(new Error('Database connection failed'))),
        findUserByEmail: mock(() => Promise.resolve(null)),
      }))
    })

    it('should throw the error and rollback transaction', async () => {
      try {
        await signUpWithEmail(mockSignupParams)
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Database connection failed')
      }

      expect(userRepo.findByEmail).toHaveBeenCalledWith(mockSignupParams.email)
      expect(db.transaction).toHaveBeenCalledTimes(1)
      expect(createUser).toHaveBeenCalledTimes(1)
      // Transaction rolled back, so auth and token operations won't be called
      expect(createAuth).not.toHaveBeenCalled()
      expect(deprecateOldTokens).not.toHaveBeenCalled()
      expect(createToken).not.toHaveBeenCalled()
      expect(emailAgent.sendWelcomeEmail).not.toHaveBeenCalled()
    })
  })

  describe('when auth creation fails', () => {
    beforeEach(async () => {
      await moduleMocker.mock('@/repositories/auth/queries', () => ({
        createAuth: mock(() => Promise.reject(new Error('Auth table unavailable'))),
      }))
    })

    it('should throw the error and rollback transaction', async () => {
      try {
        await signUpWithEmail(mockSignupParams)
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Auth table unavailable')
      }

      expect(userRepo.findByEmail).toHaveBeenCalledWith(mockSignupParams.email)
      expect(db.transaction).toHaveBeenCalledTimes(1)
      expect(createUser).toHaveBeenCalledTimes(1)
      expect(createAuth).toHaveBeenCalledTimes(1)
      // Transaction rolled back, so token operations won't be called
      expect(deprecateOldTokens).not.toHaveBeenCalled()
      expect(createToken).not.toHaveBeenCalled()
      expect(emailAgent.sendWelcomeEmail).not.toHaveBeenCalled()
    })
  })

  describe('when token creation fails', () => {
    beforeEach(async () => {
      await moduleMocker.mock('@/repositories/token/queries', () => ({
        deprecateOldTokens: mock(() => Promise.resolve()),
        createToken: mock(() => Promise.reject(new Error('Token creation failed'))),
      }))
    })

    it('should throw the error and rollback transaction', async () => {
      try {
        await signUpWithEmail(mockSignupParams)
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Token creation failed')
      }

      expect(userRepo.findByEmail).toHaveBeenCalledWith(mockSignupParams.email)
      expect(db.transaction).toHaveBeenCalledTimes(1)
      expect(createUser).toHaveBeenCalledTimes(1)
      expect(createAuth).toHaveBeenCalledTimes(1)
      expect(deprecateOldTokens).toHaveBeenCalledTimes(1)
      expect(createToken).toHaveBeenCalledTimes(1)
      expect(emailAgent.sendWelcomeEmail).not.toHaveBeenCalled()
    })
  })

  describe('when email sending fails', () => {
    beforeEach(async () => {
      await moduleMocker.mock('@/lib/email-agent', () => ({
        emailAgent: {
          sendWelcomeEmail: mock(() => Promise.reject(new Error('Email service unavailable'))),
        },
      }))
    })

    it('should complete signup successfully even if email fails (fire-and-forget)', async () => {
      // Email sending is now fire-and-forget, so signup should succeed even if email fails
      const result = await signUpWithEmail(mockSignupParams)

      // Signup should complete successfully
      expect(result).toHaveProperty('user')
      expect(result).toHaveProperty('token')
      const { tokenVersion, ...expectedUser } = mockNewUser
      expect(result.user).toEqual(expectedUser)

      // All operations should have been called
      expect(userRepo.findByEmail).toHaveBeenCalledWith(mockSignupParams.email)
      expect(db.transaction).toHaveBeenCalledTimes(1)
      expect(createUser).toHaveBeenCalledTimes(1)
      expect(createAuth).toHaveBeenCalledTimes(1)
      expect(deprecateOldTokens).toHaveBeenCalledTimes(1)
      expect(createToken).toHaveBeenCalledTimes(1)
      expect(emailAgent.sendWelcomeEmail).toHaveBeenCalledTimes(1)
    })
  })

  describe('edge cases', () => {
    it('should handle email with different cases', async () => {
      const uppercaseEmail = mockSignupParams.email.toUpperCase()
      const paramsWithUppercaseEmail = { ...mockSignupParams, email: uppercaseEmail }

      const result = await signUpWithEmail(paramsWithUppercaseEmail)

      expect(userRepo.findByEmail).toHaveBeenCalledWith(uppercaseEmail)
      expect(createUser).toHaveBeenCalledWith(
        {
          firstName: mockSignupParams.firstName,
          lastName: mockSignupParams.lastName,
          email: uppercaseEmail,
          role: Role.User,
          status: Status.New,
        },
        expect.anything(), // transaction object
      )
      const { tokenVersion, ...expectedUser } = mockNewUser
      expect(result.user).toEqual(expectedUser)
    })

    it('should handle users with minimal names', async () => {
      const paramsWithShortNames = {
        ...mockSignupParams,
        firstName: 'Al',
        lastName: 'Bo',
      }

      const userWithShortNames = { ...mockNewUser, firstName: 'Al', lastName: 'Bo' }
      await moduleMocker.mock('@/repositories/user/queries', () => ({
        createUser: mock(() => Promise.resolve(userWithShortNames)),
      }))

      await signUpWithEmail(paramsWithShortNames)

      expect(createUser).toHaveBeenCalledWith(
        {
          firstName: 'Al',
          lastName: 'Bo',
          email: mockSignupParams.email,
          role: Role.User,
          status: Status.New,
        },
        expect.anything(), // transaction object
      )

      expect(emailAgent.sendWelcomeEmail).toHaveBeenCalledWith({
        firstName: 'Al',
        email: mockSignupParams.email,
        token: mockToken,
      })
    })

    it('should always assign user role regardless of input', async () => {
      const result = await signUpWithEmail(mockSignupParams)

      expect(createUser).toHaveBeenCalledWith(
        {
          firstName: mockSignupParams.firstName,
          lastName: mockSignupParams.lastName,
          email: mockSignupParams.email,
          role: Role.User,
          status: Status.New,
        },
        expect.anything(), // transaction object
      )
      const { tokenVersion: _, ...expectedUser } = mockNewUser
      expect(result.user).toEqual(expectedUser)
      expect(result.user.role).toBe(Role.User)
    })

    it('should handle complex passwords', async () => {
      const complexPassword = 'VeryComplex@Password123!#$'
      const paramsWithComplexPassword = { ...mockSignupParams, password: complexPassword }

      await signUpWithEmail(paramsWithComplexPassword)

      // Note: We can't easily test the internal encoder.hash call
      // This test verifies that complex passwords are handled correctly
      expect(createUser).toHaveBeenCalledTimes(1)
      expect(createAuth).toHaveBeenCalledWith(
        {
          userId: mockNewUser.id,
          provider: AuthProvider.Local,
          identifier: mockSignupParams.email,
          passwordHash: mockHashedPassword,
        },
        expect.anything(), // transaction object
      )
    })

    it('should handle users with long names', async () => {
      const longFirstName = 'A'.repeat(50)
      const longLastName = 'B'.repeat(50)
      const paramsWithLongNames = {
        ...mockSignupParams,
        firstName: longFirstName,
        lastName: longLastName,
      }

      await signUpWithEmail(paramsWithLongNames)

      expect(createUser).toHaveBeenCalledWith(
        {
          firstName: longFirstName,
          lastName: longLastName,
          email: mockSignupParams.email,
          role: Role.User,
          status: Status.New,
        },
        expect.anything(), // transaction object
      )
    })
  })

  describe('when password hashing fails', () => {
    beforeEach(async () => {
      await moduleMocker.mock('@/lib/crypto', () => ({
        createPasswordEncoder: mock(() => ({
          hash: mock(() => Promise.reject(new Error('Crypto library error'))),
          compare: mock(() => Promise.resolve(true)),
        })),
      }))
    })

    it('should throw the crypto error and not proceed with transaction', async () => {
      try {
        await signUpWithEmail(mockSignupParams)
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Crypto library error')
      }

      expect(userRepo.findByEmail).toHaveBeenCalledWith(mockSignupParams.email)
      // Password hashing happens before transaction, so transaction is never started
      expect(db.transaction).not.toHaveBeenCalled()
      expect(createUser).not.toHaveBeenCalled()
      expect(createAuth).not.toHaveBeenCalled()
      expect(deprecateOldTokens).not.toHaveBeenCalled()
      expect(createToken).not.toHaveBeenCalled()
      expect(emailAgent.sendWelcomeEmail).not.toHaveBeenCalled()
    })
  })

  describe('when token deprecation fails', () => {
    beforeEach(async () => {
      await moduleMocker.mock('@/repositories/token/queries', () => ({
        deprecateOldTokens: mock(() => Promise.reject(new Error('Token deprecation failed'))),
        createToken: mock(() => Promise.resolve(1)),
      }))
    })

    it('should throw the error and rollback transaction', async () => {
      try {
        await signUpWithEmail(mockSignupParams)
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Token deprecation failed')
      }

      expect(userRepo.findByEmail).toHaveBeenCalledWith(mockSignupParams.email)
      expect(db.transaction).toHaveBeenCalledTimes(1)
      expect(createUser).toHaveBeenCalledTimes(1)
      expect(createAuth).toHaveBeenCalledTimes(1)
      expect(deprecateOldTokens).toHaveBeenCalledTimes(1)
      // Transaction rolled back, so new token creation won't be called
      expect(createToken).not.toHaveBeenCalled()
      expect(emailAgent.sendWelcomeEmail).not.toHaveBeenCalled()
    })
  })
})
