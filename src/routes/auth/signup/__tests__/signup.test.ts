import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import { ModuleMocker } from '@/__tests__/module-mocker'
import db from '@/db'
import { AppError, ErrorCode } from '@/lib/catch'
import { emailAgent } from '@/lib/email-agent'
import { authRepo, tokenRepo, userRepo } from '@/repositories'
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
        create: mock(() => Promise.resolve(mockNewUser)),
      },
      authRepo: {
        create: mock(() => Promise.resolve(1)),
      },
      tokenRepo: {
        replace: mock(() => Promise.resolve()),
      },
    }))

    await moduleMocker.mock('@/db', () => ({
      default: {
        transaction: mock(async (callback: any) => {
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

    await moduleMocker.mock('@/lib/crypto', () => ({
      hashPassword: mock(() => Promise.resolve(mockHashedPassword)),
    }))

    await moduleMocker.mock('@/lib/token', () => ({
      generateToken: mock(() => ({
        type: Token.EmailVerification,
        token: mockToken,
        expiresAt: mockExpiresAt,
      })),
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
      expect(userRepo.create).toHaveBeenCalledWith(
        {
          firstName: mockSignupParams.firstName,
          lastName: mockSignupParams.lastName,
          email: mockSignupParams.email,
          role: Role.User,
          status: Status.New,
        },
        expect.anything(),
      )
      expect(userRepo.create).toHaveBeenCalledTimes(1)
      const { tokenVersion, ...expectedUser } = mockNewUser
      expect(result.user).toEqual(expectedUser)
      expect(result).toHaveProperty('token')
      expect(result.token).toBe('mock-signup-jwt-token')
    })

    it('should create auth record with hashed password', async () => {
      await signUpWithEmail(mockSignupParams)

      expect(authRepo.create).toHaveBeenCalledWith(
        {
          userId: mockNewUser.id,
          provider: AuthProvider.Local,
          identifier: mockSignupParams.email,
          passwordHash: mockHashedPassword,
        },
        expect.anything(),
      )
      expect(authRepo.create).toHaveBeenCalledTimes(1)
    })

    it('should hash the password correctly', async () => {
      await signUpWithEmail(mockSignupParams)

      expect(userRepo.findByEmail).toHaveBeenCalledWith(mockSignupParams.email)
      expect(userRepo.create).toHaveBeenCalledTimes(1)
      expect(authRepo.create).toHaveBeenCalledWith(
        {
          userId: mockNewUser.id,
          provider: AuthProvider.Local,
          identifier: mockSignupParams.email,
          passwordHash: mockHashedPassword,
        },
        expect.anything(),
      )
    })

    it('should create email verification token', async () => {
      await signUpWithEmail(mockSignupParams)

      expect(tokenRepo.replace).toHaveBeenCalledWith(
        mockNewUser.id,
        {
          userId: mockNewUser.id,
          type: Token.EmailVerification,
          token: mockToken,
          expiresAt: mockExpiresAt,
        },
        expect.anything(),
      )
      expect(tokenRepo.replace).toHaveBeenCalledTimes(1)
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
          create: mock(() => Promise.resolve(mockNewUser)),
        },
        authRepo: {
          create: mock(() => Promise.resolve(1)),
        },
        tokenRepo: {
          replace: mock(() => Promise.resolve()),
        },
      }))
    })

    it('should throw EmailAlreadyInUse error', async () => {
      try {
        await signUpWithEmail(mockSignupParams)
        expect(true).toBe(false)
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).code).toBe(ErrorCode.EmailAlreadyInUse)
      }

      expect(userRepo.findByEmail).toHaveBeenCalledWith(mockSignupParams.email)
      expect(db.transaction).not.toHaveBeenCalled()
      expect(userRepo.create).not.toHaveBeenCalled()
      expect(authRepo.create).not.toHaveBeenCalled()
      expect(tokenRepo.replace).not.toHaveBeenCalled()

      expect(emailAgent.sendWelcomeEmail).not.toHaveBeenCalled()
    })
  })

  describe('when user creation fails', () => {
    beforeEach(async () => {
      await moduleMocker.mock('@/repositories', () => ({
        userRepo: {
          findByEmail: mock(() => Promise.resolve(null)),
          create: mock(() => Promise.reject(new Error('Database connection failed'))),
        },
      }))
    })

    it('should throw the error and rollback transaction', async () => {
      try {
        await signUpWithEmail(mockSignupParams)
        expect(true).toBe(false)
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Database connection failed')
      }

      expect(userRepo.findByEmail).toHaveBeenCalledWith(mockSignupParams.email)
      expect(db.transaction).toHaveBeenCalledTimes(1)
      expect(userRepo.create).toHaveBeenCalledTimes(1)
      expect(authRepo.create).not.toHaveBeenCalled()
      expect(tokenRepo.replace).not.toHaveBeenCalled()

      expect(emailAgent.sendWelcomeEmail).not.toHaveBeenCalled()
    })
  })

  describe('when auth creation fails', () => {
    beforeEach(async () => {
      await moduleMocker.mock('@/repositories', () => ({
        userRepo: {
          findByEmail: mock(() => Promise.resolve(null)),
          create: mock(() => Promise.resolve(mockNewUser)),
        },
        authRepo: {
          create: mock(() => Promise.reject(new Error('Auth table unavailable'))),
        },
      }))
    })

    it('should throw the error and rollback transaction', async () => {
      try {
        await signUpWithEmail(mockSignupParams)
        expect(true).toBe(false)
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Auth table unavailable')
      }

      expect(userRepo.findByEmail).toHaveBeenCalledWith(mockSignupParams.email)
      expect(db.transaction).toHaveBeenCalledTimes(1)
      expect(userRepo.create).toHaveBeenCalledTimes(1)
      expect(authRepo.create).toHaveBeenCalledTimes(1)
      expect(tokenRepo.replace).not.toHaveBeenCalled()

      expect(emailAgent.sendWelcomeEmail).not.toHaveBeenCalled()
    })
  })

  describe('when token replacement fails', () => {
    beforeEach(async () => {
      await moduleMocker.mock('@/repositories', () => ({
        userRepo: {
          findByEmail: mock(() => Promise.resolve(null)),
          create: mock(() => Promise.resolve(mockNewUser)),
        },
        authRepo: {
          create: mock(() => Promise.resolve(1)),
        },
        tokenRepo: {
          replace: mock(() => Promise.reject(new Error('Token replacement failed'))),
        },
      }))
    })

    it('should throw the error and rollback transaction', async () => {
      try {
        await signUpWithEmail(mockSignupParams)
        expect(true).toBe(false)
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Token replacement failed')
      }

      expect(userRepo.findByEmail).toHaveBeenCalledWith(mockSignupParams.email)
      expect(db.transaction).toHaveBeenCalledTimes(1)
      expect(userRepo.create).toHaveBeenCalledTimes(1)
      expect(authRepo.create).toHaveBeenCalledTimes(1)
      expect(tokenRepo.replace).toHaveBeenCalledTimes(1)

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
      const result = await signUpWithEmail(mockSignupParams)

      expect(result).toHaveProperty('user')
      expect(result).toHaveProperty('token')
      const { tokenVersion, ...expectedUser } = mockNewUser
      expect(result.user).toEqual(expectedUser)

      expect(userRepo.findByEmail).toHaveBeenCalledWith(mockSignupParams.email)
      expect(db.transaction).toHaveBeenCalledTimes(1)
      expect(userRepo.create).toHaveBeenCalledTimes(1)
      expect(authRepo.create).toHaveBeenCalledTimes(1)
      expect(tokenRepo.replace).toHaveBeenCalledTimes(1)

      expect(emailAgent.sendWelcomeEmail).toHaveBeenCalledTimes(1)
    })
  })

  describe('edge cases', () => {
    it('should handle email with different cases', async () => {
      const uppercaseEmail = mockSignupParams.email.toUpperCase()
      const paramsWithUppercaseEmail = { ...mockSignupParams, email: uppercaseEmail }

      const result = await signUpWithEmail(paramsWithUppercaseEmail)

      expect(userRepo.findByEmail).toHaveBeenCalledWith(uppercaseEmail)
      expect(userRepo.create).toHaveBeenCalledWith(
        {
          firstName: mockSignupParams.firstName,
          lastName: mockSignupParams.lastName,
          email: uppercaseEmail,
          role: Role.User,
          status: Status.New,
        },
        expect.anything(),
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
      await moduleMocker.mock('@/repositories', () => ({
        userRepo: {
          findByEmail: mock(() => Promise.resolve(null)),
          create: mock(() => Promise.resolve(userWithShortNames)),
        },
      }))

      await signUpWithEmail(paramsWithShortNames)

      expect(userRepo.create).toHaveBeenCalledWith(
        {
          firstName: 'Al',
          lastName: 'Bo',
          email: mockSignupParams.email,
          role: Role.User,
          status: Status.New,
        },
        expect.anything(),
      )

      expect(emailAgent.sendWelcomeEmail).toHaveBeenCalledWith({
        firstName: 'Al',
        email: mockSignupParams.email,
        token: mockToken,
      })
    })

    it('should always assign user role regardless of input', async () => {
      const result = await signUpWithEmail(mockSignupParams)

      expect(userRepo.create).toHaveBeenCalledWith(
        {
          firstName: mockSignupParams.firstName,
          lastName: mockSignupParams.lastName,
          email: mockSignupParams.email,
          role: Role.User,
          status: Status.New,
        },
        expect.anything(),
      )
      const { tokenVersion: _, ...expectedUser } = mockNewUser
      expect(result.user).toEqual(expectedUser)
      expect(result.user.role).toBe(Role.User)
    })

    it('should handle complex passwords', async () => {
      const complexPassword = 'VeryComplex@Password123!#$'
      const paramsWithComplexPassword = { ...mockSignupParams, password: complexPassword }

      await signUpWithEmail(paramsWithComplexPassword)

      expect(userRepo.create).toHaveBeenCalledTimes(1)
      expect(authRepo.create).toHaveBeenCalledWith(
        {
          userId: mockNewUser.id,
          provider: AuthProvider.Local,
          identifier: mockSignupParams.email,
          passwordHash: mockHashedPassword,
        },
        expect.anything(),
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

      expect(userRepo.create).toHaveBeenCalledWith(
        {
          firstName: longFirstName,
          lastName: longLastName,
          email: mockSignupParams.email,
          role: Role.User,
          status: Status.New,
        },
        expect.anything(),
      )
    })
  })

  describe('when password hashing fails', () => {
    beforeEach(async () => {
      await moduleMocker.mock('@/lib/crypto', () => ({
        hashPassword: mock(() => Promise.reject(new Error('Password hashing failed'))),
      }))
    })

    it('should throw the crypto error and not proceed with transaction', async () => {
      try {
        await signUpWithEmail(mockSignupParams)
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Password hashing failed')
      }

      expect(userRepo.findByEmail).toHaveBeenCalledWith(mockSignupParams.email)
      expect(db.transaction).not.toHaveBeenCalled()
      expect(userRepo.create).not.toHaveBeenCalled()
      expect(authRepo.create).not.toHaveBeenCalled()
      expect(tokenRepo.replace).not.toHaveBeenCalled()

      expect(emailAgent.sendWelcomeEmail).not.toHaveBeenCalled()
    })
  })

  describe('when token replacement fails', () => {
    beforeEach(async () => {
      await moduleMocker.mock('@/repositories', () => ({
        userRepo: {
          findByEmail: mock(() => Promise.resolve(null)),
          create: mock(() => Promise.resolve(mockNewUser)),
        },
        authRepo: {
          create: mock(() => Promise.resolve(1)),
        },
        tokenRepo: {
          replace: mock(() => Promise.reject(new Error('Token replacement failed'))),
        },
      }))
    })

    it('should throw the error and rollback transaction', async () => {
      try {
        await signUpWithEmail(mockSignupParams)
        expect(true).toBe(false)
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Token replacement failed')
      }

      expect(userRepo.findByEmail).toHaveBeenCalledWith(mockSignupParams.email)
      expect(db.transaction).toHaveBeenCalledTimes(1)
      expect(userRepo.create).toHaveBeenCalledTimes(1)
      expect(authRepo.create).toHaveBeenCalledTimes(1)
      expect(tokenRepo.replace).toHaveBeenCalledTimes(1)

      expect(emailAgent.sendWelcomeEmail).not.toHaveBeenCalled()
    })
  })
})
