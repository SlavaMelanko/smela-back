import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import type { User } from '@/data'

import { ModuleMocker } from '@/__tests__/module-mocker'
import { toTypeSafeUser } from '@/data/repositories/user/queries'
import { AppError, ErrorCode } from '@/errors'
import { TokenType } from '@/security/token'
import { AuthProvider, Role, Status } from '@/types'
import { hours, nowPlus } from '@/utils/chrono'

import type { SignupParams } from '../signup'

import signUpWithEmail from '../signup'

describe('Signup with Email', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockSignupParams: SignupParams
  let mockDeviceInfo: { ipAddress: string, userAgent: string }

  let mockNewUser: User
  let mockUserRepo: any
  let mockAuthRepo: any
  let mockTokenRepo: any
  let mockRefreshTokenRepo: any
  let mockTransaction: any

  let mockHashedPassword: string
  let mockHashPassword: any

  let mockTokenString: string
  let mockExpiresAt: Date
  let mockGenerateToken: any

  let mockRefreshToken: string
  let mockRefreshTokenHash: string
  let mockRefreshExpiresAt: Date
  let mockGenerateHashedToken: any

  let mockEmailAgent: any

  let mockJwtToken: string
  let mockCreateJwt: any

  beforeEach(async () => {
    mockSignupParams = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'ValidPass123!',
    }
    mockDeviceInfo = {
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0 (Test)',
    }

    mockNewUser = toTypeSafeUser({
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      status: Status.New,
      role: Role.User,
      createdAt: new Date(),
      updatedAt: new Date(),
    })!
    mockUserRepo = {
      findByEmail: mock(async () => null),
      create: mock(async () => mockNewUser),
    }
    mockAuthRepo = {
      create: mock(async () => 1),
    }
    mockTokenRepo = {
      replace: mock(async () => {}),
    }
    mockRefreshTokenRepo = {
      create: mock(async () => 1),
    }
    mockTransaction = {
      transaction: mock(async (callback: any) => callback({}) as Promise<void>),
    }

    await moduleMocker.mock('@/data', () => ({
      userRepo: mockUserRepo,
      authRepo: mockAuthRepo,
      tokenRepo: mockTokenRepo,
      refreshTokenRepo: mockRefreshTokenRepo,
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

    mockRefreshToken = 'refresh_token_123'
    mockRefreshTokenHash = 'hashed_refresh_token_123'
    mockRefreshExpiresAt = nowPlus(hours(168)) // 7 days
    mockGenerateHashedToken = mock(async () => ({
      token: { raw: mockRefreshToken, hashed: mockRefreshTokenHash },
      expiresAt: mockRefreshExpiresAt,
      type: 'refresh_token',
    }))

    await moduleMocker.mock('@/security/token', () => ({
      generateToken: mockGenerateToken,
      generateHashedToken: mockGenerateHashedToken,
      TokenType: { EmailVerification: 'email_verification', RefreshToken: 'refresh_token' },
    }))

    mockEmailAgent = {
      sendWelcomeEmail: mock(async () => {}),
    }

    await moduleMocker.mock('@/services', () => ({
      emailAgent: mockEmailAgent,
    }))

    mockJwtToken = 'mock-signup-jwt-token'
    mockCreateJwt = mock(async () => mockJwtToken)

    await moduleMocker.mock('@/security/jwt', () => ({
      signJwt: mockCreateJwt,
    }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  describe('when signup is successful', () => {
    it('should create a new user with correct data', async () => {
      const result = await signUpWithEmail(mockSignupParams, mockDeviceInfo)

      expect(mockTransaction.transaction).toHaveBeenCalledTimes(1)
      expect(mockUserRepo.create).toHaveBeenCalledWith(
        {
          firstName: mockSignupParams.firstName,
          lastName: mockSignupParams.lastName,
          email: mockSignupParams.email,
          role: Role.User,
          status: Status.New,
        },
        expect.anything(),
      )
      expect(mockUserRepo.create).toHaveBeenCalledTimes(1)
      const expectedUser = mockNewUser
      expect(result.data.user).toEqual(expectedUser)
      expect(result).toHaveProperty('refreshToken')
      expect(result.refreshToken).toBe(mockRefreshToken)
      expect(result.data).toHaveProperty('accessToken')
      expect(result.data.accessToken).toBe(mockJwtToken)
    })

    it('should create auth record with hashed password', async () => {
      await signUpWithEmail(mockSignupParams, mockDeviceInfo)

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
      await signUpWithEmail(mockSignupParams, mockDeviceInfo)

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
      await signUpWithEmail(mockSignupParams, mockDeviceInfo)

      expect(mockTokenRepo.replace).toHaveBeenCalledWith(
        mockNewUser.id,
        {
          userId: mockNewUser.id,
          type: TokenType.EmailVerification,
          token: mockTokenString,
          expiresAt: mockExpiresAt,
        },
        expect.anything(),
      )
      expect(mockTokenRepo.replace).toHaveBeenCalledTimes(1)
    })

    it('should send welcome email with verification token', async () => {
      await signUpWithEmail(mockSignupParams, mockDeviceInfo)

      expect(mockEmailAgent.sendWelcomeEmail).toHaveBeenCalledWith(
        mockNewUser.firstName,
        mockNewUser.email,
        mockTokenString,
        undefined,
      )
      expect(mockEmailAgent.sendWelcomeEmail).toHaveBeenCalledTimes(1)
    })

    it('should generate JWT token for immediate authentication', async () => {
      const result = await signUpWithEmail(mockSignupParams, mockDeviceInfo)

      expect(result.data).toHaveProperty('accessToken')
      expect(result.data.accessToken).toBe(mockJwtToken)
      expect(result).toHaveProperty('refreshToken')
      expect(result.refreshToken).toBe(mockRefreshToken)
      expect(result).toHaveProperty('data')
    })

    it('should create refresh token with device info', async () => {
      await signUpWithEmail(mockSignupParams, mockDeviceInfo)

      expect(mockRefreshTokenRepo.create).toHaveBeenCalledWith({
        userId: mockNewUser.id,
        tokenHash: mockRefreshTokenHash,
        ipAddress: mockDeviceInfo.ipAddress,
        userAgent: mockDeviceInfo.userAgent,
        expiresAt: mockRefreshExpiresAt,
      })
      expect(mockRefreshTokenRepo.create).toHaveBeenCalledTimes(1)
    })

    it('should not return sensitive fields in the response', async () => {
      const result = await signUpWithEmail(mockSignupParams, mockDeviceInfo)

      // Ensure tokenVersion is not included in the response
      expect(result.data.user).not.toHaveProperty('tokenVersion')
      // createdAt and updatedAt are now included in the response
      expect(result.data.user).toHaveProperty('createdAt')
      expect(result.data.user).toHaveProperty('updatedAt')

      // Ensure expected fields are present
      expect(result.data.user).toHaveProperty('id')
      expect(result.data.user).toHaveProperty('firstName')
      expect(result.data.user).toHaveProperty('lastName')
      expect(result.data.user).toHaveProperty('email')
      expect(result.data.user).toHaveProperty('status')
      expect(result.data.user).toHaveProperty('role')
    })

    it('should check for existing user first', async () => {
      await signUpWithEmail(mockSignupParams, mockDeviceInfo)

      expect(mockUserRepo.findByEmail).toHaveBeenCalledWith(mockSignupParams.email)
      expect(mockUserRepo.findByEmail).toHaveBeenCalledTimes(1)
    })
  })

  describe('when email is already in use', () => {
    it('should throw EmailAlreadyInUse error', async () => {
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

      mockUserRepo.findByEmail.mockImplementation(async () => existingUser)

      try {
        await signUpWithEmail(mockSignupParams, mockDeviceInfo)
        expect(true).toBe(false)
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).code).toBe(ErrorCode.EmailAlreadyInUse)
      }

      expect(mockUserRepo.findByEmail).toHaveBeenCalledWith(mockSignupParams.email)
      expect(mockTransaction.transaction).not.toHaveBeenCalled()
      expect(mockUserRepo.create).not.toHaveBeenCalled()
      expect(mockAuthRepo.create).not.toHaveBeenCalled()
      expect(mockTokenRepo.replace).not.toHaveBeenCalled()

      expect(mockEmailAgent.sendWelcomeEmail).not.toHaveBeenCalled()
    })
  })

  describe('when user creation fails', () => {
    it('should throw the error and rollback transaction', async () => {
      mockUserRepo.create.mockImplementation(async () => {
        throw new Error('Database connection failed')
      })

      try {
        await signUpWithEmail(mockSignupParams, mockDeviceInfo)
        expect(true).toBe(false)
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Database connection failed')
      }

      expect(mockUserRepo.findByEmail).toHaveBeenCalledWith(mockSignupParams.email)
      expect(mockTransaction.transaction).toHaveBeenCalledTimes(1)
      expect(mockUserRepo.create).toHaveBeenCalledTimes(1)
      expect(mockAuthRepo.create).not.toHaveBeenCalled()
      expect(mockTokenRepo.replace).not.toHaveBeenCalled()

      expect(mockEmailAgent.sendWelcomeEmail).not.toHaveBeenCalled()
    })
  })

  describe('when auth creation fails', () => {
    it('should throw the error and rollback transaction', async () => {
      mockAuthRepo.create.mockImplementation(async () => {
        throw new Error('Auth table unavailable')
      })

      try {
        await signUpWithEmail(mockSignupParams, mockDeviceInfo)
        expect(true).toBe(false)
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Auth table unavailable')
      }

      expect(mockUserRepo.findByEmail).toHaveBeenCalledWith(mockSignupParams.email)
      expect(mockTransaction.transaction).toHaveBeenCalledTimes(1)
      expect(mockUserRepo.create).toHaveBeenCalledTimes(1)
      expect(mockAuthRepo.create).toHaveBeenCalledTimes(1)
      expect(mockTokenRepo.replace).not.toHaveBeenCalled()

      expect(mockEmailAgent.sendWelcomeEmail).not.toHaveBeenCalled()
    })
  })

  describe('when token replacement fails', () => {
    it('should throw the error and rollback transaction', async () => {
      mockTokenRepo.replace.mockImplementation(async () => {
        throw new Error('Token replacement failed')
      })

      try {
        await signUpWithEmail(mockSignupParams, mockDeviceInfo)
        expect(true).toBe(false)
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Token replacement failed')
      }

      expect(mockUserRepo.findByEmail).toHaveBeenCalledWith(mockSignupParams.email)
      expect(mockTransaction.transaction).toHaveBeenCalledTimes(1)
      expect(mockUserRepo.create).toHaveBeenCalledTimes(1)
      expect(mockAuthRepo.create).toHaveBeenCalledTimes(1)
      expect(mockTokenRepo.replace).toHaveBeenCalledTimes(1)

      expect(mockEmailAgent.sendWelcomeEmail).not.toHaveBeenCalled()
    })
  })

  describe('when email sending fails', () => {
    it('should complete signup successfully even if email fails (fire-and-forget)', async () => {
      mockEmailAgent.sendWelcomeEmail.mockImplementation(async () => {
        throw new Error('Email service unavailable')
      })

      const result = await signUpWithEmail(mockSignupParams, mockDeviceInfo)

      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('refreshToken')
      expect(result.refreshToken).toBe(mockRefreshToken)
      const expectedUser = mockNewUser
      expect(result.data.user).toEqual(expectedUser)

      expect(mockUserRepo.findByEmail).toHaveBeenCalledWith(mockSignupParams.email)
      expect(mockTransaction.transaction).toHaveBeenCalledTimes(1)
      expect(mockUserRepo.create).toHaveBeenCalledTimes(1)
      expect(mockAuthRepo.create).toHaveBeenCalledTimes(1)
      expect(mockTokenRepo.replace).toHaveBeenCalledTimes(1)

      expect(mockEmailAgent.sendWelcomeEmail).toHaveBeenCalledTimes(1)
    })
  })

  describe('edge cases', () => {
    it('should handle email with different cases', async () => {
      const uppercaseEmail = mockSignupParams.email.toUpperCase()
      const paramsWithUppercaseEmail = { ...mockSignupParams, email: uppercaseEmail }

      const result = await signUpWithEmail(paramsWithUppercaseEmail, mockDeviceInfo)

      expect(mockUserRepo.findByEmail).toHaveBeenCalledWith(uppercaseEmail)
      expect(mockUserRepo.create).toHaveBeenCalledWith(
        {
          firstName: mockSignupParams.firstName,
          lastName: mockSignupParams.lastName,
          email: uppercaseEmail,
          role: Role.User,
          status: Status.New,
        },
        expect.anything(),
      )
      const expectedUser = mockNewUser
      expect(result.data.user).toEqual(expectedUser)
    })

    it('should handle users with minimal names', async () => {
      const paramsWithShortNames = {
        ...mockSignupParams,
        firstName: 'Al',
        lastName: 'Bo',
      }

      const userWithShortNames = { ...mockNewUser, firstName: 'Al', lastName: 'Bo' }
      mockUserRepo.create.mockImplementation(async () => userWithShortNames)

      await signUpWithEmail(paramsWithShortNames, mockDeviceInfo)

      expect(mockUserRepo.create).toHaveBeenCalledWith(
        {
          firstName: 'Al',
          lastName: 'Bo',
          email: mockSignupParams.email,
          role: Role.User,
          status: Status.New,
        },
        expect.anything(),
      )

      expect(mockEmailAgent.sendWelcomeEmail).toHaveBeenCalledWith(
        'Al',
        mockSignupParams.email,
        mockTokenString,
        undefined,
      )
    })

    it('should always assign user role regardless of input', async () => {
      const result = await signUpWithEmail(mockSignupParams, mockDeviceInfo)

      const expectedUser = mockNewUser
      expect(mockUserRepo.create).toHaveBeenCalledWith(
        {
          firstName: mockSignupParams.firstName,
          lastName: mockSignupParams.lastName,
          email: mockSignupParams.email,
          role: Role.User,
          status: Status.New,
        },
        expect.anything(),
      )
      expect(result.data.user).toEqual(expectedUser)
      expect(result.data.user.role).toBe(Role.User)
    })

    it('should handle complex passwords', async () => {
      const complexPassword = 'VeryComplex@Password123!#$'
      const paramsWithComplexPassword = { ...mockSignupParams, password: complexPassword }

      await signUpWithEmail(paramsWithComplexPassword, mockDeviceInfo)

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

      await signUpWithEmail(paramsWithLongNames, mockDeviceInfo)

      expect(mockUserRepo.create).toHaveBeenCalledWith(
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
    it('should throw the cipher error and not proceed with transaction', async () => {
      mockHashPassword.mockImplementation(async () => {
        throw new Error('Password hashing failed')
      })

      try {
        await signUpWithEmail(mockSignupParams, mockDeviceInfo)
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Password hashing failed')
      }

      expect(mockUserRepo.findByEmail).toHaveBeenCalledWith(mockSignupParams.email)
      expect(mockTransaction.transaction).not.toHaveBeenCalled()
      expect(mockUserRepo.create).not.toHaveBeenCalled()
      expect(mockAuthRepo.create).not.toHaveBeenCalled()
      expect(mockTokenRepo.replace).not.toHaveBeenCalled()

      expect(mockEmailAgent.sendWelcomeEmail).not.toHaveBeenCalled()
    })
  })

  describe('when token replacement fails', () => {
    it('should throw the error and rollback transaction', async () => {
      mockTokenRepo.replace.mockImplementation(async () => {
        throw new Error('Token replacement failed')
      })

      try {
        await signUpWithEmail(mockSignupParams, mockDeviceInfo)
        expect(true).toBe(false)
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Token replacement failed')
      }

      expect(mockUserRepo.findByEmail).toHaveBeenCalledWith(mockSignupParams.email)
      expect(mockTransaction.transaction).toHaveBeenCalledTimes(1)
      expect(mockUserRepo.create).toHaveBeenCalledTimes(1)
      expect(mockAuthRepo.create).toHaveBeenCalledTimes(1)
      expect(mockTokenRepo.replace).toHaveBeenCalledTimes(1)

      expect(mockEmailAgent.sendWelcomeEmail).not.toHaveBeenCalled()
    })
  })
})
