import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import type { User } from '@/data'

import { ModuleMocker, testUuids } from '@/__tests__'
import { AppError, ErrorCode } from '@/errors'
import { TokenType } from '@/security/token'
import { AuthProvider, Role, Status } from '@/types'
import { hours, nowPlus } from '@/utils/chrono'

import type { SignupParams } from '../signup'

import signUpWithEmail from '../signup'

describe('Signup with Email', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockSignupParams: SignupParams

  let mockNewUser: User
  let mockUserRepo: any
  let mockAuthRepo: any
  let mockTokenRepo: any
  let mockTransaction: any

  let mockHashedPassword: string
  let mockHashPassword: any

  let mockTokenString: string
  let mockExpiresAt: Date
  let mockGenerateToken: any

  let mockEmailAgent: any

  beforeEach(async () => {
    mockSignupParams = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'ValidPass123!',
    }

    mockNewUser = {
      id: testUuids.USER_1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      status: Status.New,
      role: Role.User,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    mockUserRepo = {
      findByEmail: mock(async () => null),
      create: mock(async () => mockNewUser),
    }
    mockAuthRepo = {
      create: mock(async () => 1),
    }
    mockTokenRepo = {
      issue: mock(async () => {}),
    }
    mockTransaction = {
      transaction: mock(async (callback: any) => callback({}) as Promise<void>),
    }

    await moduleMocker.mock('@/data', () => ({
      userRepo: mockUserRepo,
      authRepo: mockAuthRepo,
      tokenRepo: mockTokenRepo,
      db: mockTransaction,
    }))

    mockHashedPassword = '$2b$10$hashedPassword123'
    mockHashPassword = mock(async () => mockHashedPassword)

    await moduleMocker.mock('@/security/password', () => ({
      hashPassword: mockHashPassword,
    }))

    mockTokenString = 'verification-token-123'
    mockExpiresAt = nowPlus(hours(48))
    mockGenerateToken = mock(() => ({
      type: TokenType.EmailVerification,
      token: mockTokenString,
      expiresAt: mockExpiresAt,
    }))

    await moduleMocker.mock('@/security/token', () => ({
      generateToken: mockGenerateToken,
      TokenType: { EmailVerification: 'email_verification' },
    }))

    mockEmailAgent = {
      sendEmailVerificationEmail: mock(async () => {}),
    }

    await moduleMocker.mock('@/services', () => ({
      emailAgent: mockEmailAgent,
    }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  describe('when signup is successful', () => {
    it('should create a new user with correct data', async () => {
      const result = await signUpWithEmail(mockSignupParams)

      expect(mockTransaction.transaction).toHaveBeenCalledTimes(1)
      expect(mockUserRepo.create).toHaveBeenCalledWith(
        {
          firstName: mockSignupParams.firstName,
          lastName: mockSignupParams.lastName,
          email: mockSignupParams.email,
          status: Status.New,
        },
        expect.anything(),
      )
      expect(mockUserRepo.create).toHaveBeenCalledTimes(1)
      expect(result.user).toEqual(mockNewUser)
    })

    it('should create auth record with hashed password', async () => {
      await signUpWithEmail(mockSignupParams)

      expect(mockAuthRepo.create).toHaveBeenCalledWith(
        {
          userId: mockNewUser.id,
          provider: AuthProvider.Local,
          identifier: mockSignupParams.email,
          passwordHash: mockHashedPassword,
        },
        expect.anything(),
      )
      expect(mockAuthRepo.create).toHaveBeenCalledTimes(1)
    })

    it('should hash the password correctly', async () => {
      await signUpWithEmail(mockSignupParams)

      expect(mockUserRepo.findByEmail).toHaveBeenCalledWith(mockSignupParams.email)
      expect(mockUserRepo.create).toHaveBeenCalledTimes(1)
      expect(mockAuthRepo.create).toHaveBeenCalledWith(
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

      expect(mockTokenRepo.issue).toHaveBeenCalledWith(
        mockNewUser.id,
        {
          userId: mockNewUser.id,
          type: TokenType.EmailVerification,
          token: mockTokenString,
          expiresAt: mockExpiresAt,
        },
        expect.anything(),
      )
      expect(mockTokenRepo.issue).toHaveBeenCalledTimes(1)
    })

    it('should send email verification email with verification token', async () => {
      await signUpWithEmail(mockSignupParams)

      expect(mockEmailAgent.sendEmailVerificationEmail).toHaveBeenCalledWith(
        mockNewUser.firstName,
        mockNewUser.email,
        mockTokenString,
        undefined,
      )
      expect(mockEmailAgent.sendEmailVerificationEmail).toHaveBeenCalledTimes(1)
    })

    it('should not return sensitive fields in the response', async () => {
      const result = await signUpWithEmail(mockSignupParams)

      expect(result.user).not.toHaveProperty('tokenVersion')
      expect(result.user).toHaveProperty('createdAt')
      expect(result.user).toHaveProperty('updatedAt')
      expect(result.user).toHaveProperty('id')
      expect(result.user).toHaveProperty('firstName')
      expect(result.user).toHaveProperty('lastName')
      expect(result.user).toHaveProperty('email')
      expect(result.user).toHaveProperty('status')
      expect(result.user).toHaveProperty('role')
    })

    it('should check for existing user first', async () => {
      await signUpWithEmail(mockSignupParams)

      expect(mockUserRepo.findByEmail).toHaveBeenCalledWith(mockSignupParams.email)
      expect(mockUserRepo.findByEmail).toHaveBeenCalledTimes(1)
    })
  })

  describe('when email is already in use', () => {
    it('should throw EmailAlreadyInUse error', async () => {
      const existingUser = {
        id: testUuids.USER_2,
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'john@example.com',
        status: Status.Verified,
        role: Role.User,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockUserRepo.findByEmail.mockImplementation(async () => existingUser)

      try {
        await signUpWithEmail(mockSignupParams)
        expect(true).toBe(false)
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).code).toBe(ErrorCode.EmailAlreadyInUse)
      }

      expect(mockUserRepo.findByEmail).toHaveBeenCalledWith(mockSignupParams.email)
      expect(mockTransaction.transaction).not.toHaveBeenCalled()
      expect(mockUserRepo.create).not.toHaveBeenCalled()
      expect(mockAuthRepo.create).not.toHaveBeenCalled()
      expect(mockTokenRepo.issue).not.toHaveBeenCalled()

      expect(mockEmailAgent.sendEmailVerificationEmail).not.toHaveBeenCalled()
    })
  })

  describe('when user creation fails', () => {
    it('should throw the error and rollback transaction', async () => {
      mockUserRepo.create.mockImplementation(async () => {
        throw new Error('Database connection failed')
      })

      try {
        await signUpWithEmail(mockSignupParams)
        expect(true).toBe(false)
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Database connection failed')
      }

      expect(mockUserRepo.findByEmail).toHaveBeenCalledWith(mockSignupParams.email)
      expect(mockTransaction.transaction).toHaveBeenCalledTimes(1)
      expect(mockUserRepo.create).toHaveBeenCalledTimes(1)
      expect(mockAuthRepo.create).not.toHaveBeenCalled()
      expect(mockTokenRepo.issue).not.toHaveBeenCalled()

      expect(mockEmailAgent.sendEmailVerificationEmail).not.toHaveBeenCalled()
    })
  })

  describe('when auth creation fails', () => {
    it('should throw the error and rollback transaction', async () => {
      mockAuthRepo.create.mockImplementation(async () => {
        throw new Error('Auth table unavailable')
      })

      try {
        await signUpWithEmail(mockSignupParams)
        expect(true).toBe(false)
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Auth table unavailable')
      }

      expect(mockUserRepo.findByEmail).toHaveBeenCalledWith(mockSignupParams.email)
      expect(mockTransaction.transaction).toHaveBeenCalledTimes(1)
      expect(mockUserRepo.create).toHaveBeenCalledTimes(1)
      expect(mockAuthRepo.create).toHaveBeenCalledTimes(1)
      expect(mockTokenRepo.issue).not.toHaveBeenCalled()

      expect(mockEmailAgent.sendEmailVerificationEmail).not.toHaveBeenCalled()
    })
  })

  describe('when token replacement fails', () => {
    it('should throw the error and rollback transaction', async () => {
      mockTokenRepo.issue.mockImplementation(async () => {
        throw new Error('Token replacement failed')
      })

      try {
        await signUpWithEmail(mockSignupParams)
        expect(true).toBe(false)
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Token replacement failed')
      }

      expect(mockUserRepo.findByEmail).toHaveBeenCalledWith(mockSignupParams.email)
      expect(mockTransaction.transaction).toHaveBeenCalledTimes(1)
      expect(mockUserRepo.create).toHaveBeenCalledTimes(1)
      expect(mockAuthRepo.create).toHaveBeenCalledTimes(1)
      expect(mockTokenRepo.issue).toHaveBeenCalledTimes(1)

      expect(mockEmailAgent.sendEmailVerificationEmail).not.toHaveBeenCalled()
    })
  })

  describe('when email sending fails', () => {
    it('should complete signup successfully even if email fails (fire-and-forget)', async () => {
      mockEmailAgent.sendEmailVerificationEmail.mockImplementation(async () => {
        throw new Error('Email service unavailable')
      })

      const result = await signUpWithEmail(mockSignupParams)

      expect(result.user).toEqual(mockNewUser)

      expect(mockUserRepo.findByEmail).toHaveBeenCalledWith(mockSignupParams.email)
      expect(mockTransaction.transaction).toHaveBeenCalledTimes(1)
      expect(mockUserRepo.create).toHaveBeenCalledTimes(1)
      expect(mockAuthRepo.create).toHaveBeenCalledTimes(1)
      expect(mockTokenRepo.issue).toHaveBeenCalledTimes(1)

      expect(mockEmailAgent.sendEmailVerificationEmail).toHaveBeenCalledTimes(1)
    })
  })

  describe('edge cases', () => {
    it('should handle email with different cases', async () => {
      const uppercaseEmail = mockSignupParams.email.toUpperCase()
      const paramsWithUppercaseEmail = { ...mockSignupParams, email: uppercaseEmail }

      const result = await signUpWithEmail(paramsWithUppercaseEmail)

      expect(mockUserRepo.findByEmail).toHaveBeenCalledWith(uppercaseEmail)
      expect(mockUserRepo.create).toHaveBeenCalledWith(
        {
          firstName: mockSignupParams.firstName,
          lastName: mockSignupParams.lastName,
          email: uppercaseEmail,
          status: Status.New,
        },
        expect.anything(),
      )
      expect(result.user).toEqual(mockNewUser)
    })

    it('should handle users with minimal names', async () => {
      const paramsWithShortNames = {
        ...mockSignupParams,
        firstName: 'Al',
        lastName: 'Bo',
      }

      const userWithShortNames = { ...mockNewUser, firstName: 'Al', lastName: 'Bo' }
      mockUserRepo.create.mockImplementation(async () => userWithShortNames)

      await signUpWithEmail(paramsWithShortNames)

      expect(mockUserRepo.create).toHaveBeenCalledWith(
        {
          firstName: 'Al',
          lastName: 'Bo',
          email: mockSignupParams.email,
          status: Status.New,
        },
        expect.anything(),
      )

      expect(mockEmailAgent.sendEmailVerificationEmail).toHaveBeenCalledWith(
        'Al',
        mockSignupParams.email,
        mockTokenString,
        undefined,
      )
    })

    it('should return user with default User role', async () => {
      const result = await signUpWithEmail(mockSignupParams)

      expect(result.user).toEqual(mockNewUser)
      expect(result.user.role).toBe(Role.User)
    })

    it('should handle complex passwords', async () => {
      const complexPassword = 'VeryComplex@Password123!#$'
      const paramsWithComplexPassword = { ...mockSignupParams, password: complexPassword }

      await signUpWithEmail(paramsWithComplexPassword)

      expect(mockUserRepo.create).toHaveBeenCalledTimes(1)
      expect(mockAuthRepo.create).toHaveBeenCalledWith(
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

      expect(mockUserRepo.create).toHaveBeenCalledWith(
        {
          firstName: longFirstName,
          lastName: longLastName,
          email: mockSignupParams.email,
          status: Status.New,
        },
        expect.anything(),
      )
    })
  })

  describe('when password hashing fails', () => {
    it('should throw the cipher error and not proceed with transaction', async () => {
      mockHashPassword.mockImplementation(async () => {
        throw new Error('Password hashing failed')
      })

      try {
        await signUpWithEmail(mockSignupParams)
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Password hashing failed')
      }

      expect(mockUserRepo.findByEmail).toHaveBeenCalledWith(mockSignupParams.email)
      expect(mockTransaction.transaction).not.toHaveBeenCalled()
      expect(mockUserRepo.create).not.toHaveBeenCalled()
      expect(mockAuthRepo.create).not.toHaveBeenCalled()
      expect(mockTokenRepo.issue).not.toHaveBeenCalled()

      expect(mockEmailAgent.sendEmailVerificationEmail).not.toHaveBeenCalled()
    })
  })
})
