import { beforeEach, describe, expect, it, mock } from 'bun:test'

// Mock environment first to prevent email provider initialization
mock.module('@/lib/env', () => ({
  default: {
    EMAIL_RESEND_API_KEY: 'test-api-key',
    EMAIL_SENDER_PROFILES: JSON.stringify({
      system: {
        email: 'noreply@test.com',
        name: 'Test System',
      },
    }),
  },
}))

// Mock email agent to prevent actual email sending
mock.module('@/lib/email-agent', () => ({
  emailAgent: {
    sendWelcomeEmail: mock(() => Promise.resolve()),
  },
}))

// Mock JWT
const mockJwtSign = mock((id: number, email: string, role: string, status: string, tokenVersion: number) =>
  Promise.resolve(`mock-jwt-${id}-${email}-${tokenVersion}`),
)

mock.module('@/lib/auth', () => ({
  jwt: {
    sign: mockJwtSign,
  },
}))

import { jwt } from '@/lib/auth'
import { AppError, ErrorCode } from '@/lib/catch'
import { emailAgent } from '@/lib/email-agent'
import { authRepo, tokenRepo, userRepo } from '@/repositories'
import { AuthProvider, Role, Status, Token } from '@/types'

import signUpWithEmail from '../signup'

describe('signUpWithEmail', () => {
  const mockSignupParams = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    password: 'ValidPass123!',
    role: Role.User,
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

  beforeEach(() => {
    // Clear JWT mocks
    mockJwtSign.mockClear()

    // Mock repository methods
    mock.module('@/repositories', () => ({
      userRepo: {
        findByEmail: mock(() => Promise.resolve(null)), // No existing user by default
        create: mock(() => Promise.resolve(mockNewUser)),
      },
      authRepo: {
        create: mock(() => Promise.resolve()),
      },
      tokenRepo: {
        deprecateOld: mock(() => Promise.resolve()),
        create: mock(() => Promise.resolve()),
      },
    }))

    // Mock crypto password encoder
    mock.module('@/lib/crypto', () => ({
      createPasswordEncoder: mock(() => ({
        hash: mock(() => Promise.resolve(mockHashedPassword)),
        compare: mock(() => Promise.resolve(true)),
      })),
    }))

    // Mock token generation
    mock.module('@/lib/token', () => ({
      generateToken: mock(() => ({
        type: Token.EmailVerification,
        token: mockToken,
        expiresAt: mockExpiresAt,
      })),
      EMAIL_VERIFICATION_EXPIRY_HOURS: 48,
    }))

    // Mock email agent
    mock.module('@/lib/email-agent', () => ({
      emailAgent: {
        sendWelcomeEmail: mock(() => Promise.resolve()),
      },
    }))
  })

  describe('when signup is successful', () => {
    it('should create a new user with correct data', async () => {
      const result = await signUpWithEmail(mockSignupParams)

      expect(userRepo.create).toHaveBeenCalledWith({
        firstName: mockSignupParams.firstName,
        lastName: mockSignupParams.lastName,
        email: mockSignupParams.email,
        role: mockSignupParams.role,
        status: Status.New,
      })
      expect(userRepo.create).toHaveBeenCalledTimes(1)
      const { tokenVersion, ...expectedUser } = mockNewUser
      expect(result.user).toEqual(expectedUser)
      expect(result.token).toBe(`mock-jwt-${mockNewUser.id}-${mockNewUser.email}-1`)
    })

    it('should create auth record with hashed password', async () => {
      await signUpWithEmail(mockSignupParams)

      expect(authRepo.create).toHaveBeenCalledWith({
        userId: mockNewUser.id,
        provider: AuthProvider.Local,
        identifier: mockSignupParams.email,
        passwordHash: mockHashedPassword,
      })
      expect(authRepo.create).toHaveBeenCalledTimes(1)
    })

    it('should hash the password correctly', async () => {
      await signUpWithEmail(mockSignupParams)

      // Note: We can't easily test the internal encoder.hash call
      // because createPasswordEncoder() creates a new instance each time
      // This test verifies that the signup flow completes successfully
      expect(userRepo.findByEmail).toHaveBeenCalledWith(mockSignupParams.email)
      expect(userRepo.create).toHaveBeenCalledTimes(1)
      expect(authRepo.create).toHaveBeenCalledWith({
        userId: mockNewUser.id,
        provider: AuthProvider.Local,
        identifier: mockSignupParams.email,
        passwordHash: mockHashedPassword,
      })
    })

    it('should create email verification token', async () => {
      await signUpWithEmail(mockSignupParams)

      expect(tokenRepo.deprecateOld).toHaveBeenCalledWith(mockNewUser.id, Token.EmailVerification)
      expect(tokenRepo.deprecateOld).toHaveBeenCalledTimes(1)

      expect(tokenRepo.create).toHaveBeenCalledWith({
        userId: mockNewUser.id,
        type: Token.EmailVerification,
        token: mockToken,
        expiresAt: mockExpiresAt,
      })
      expect(tokenRepo.create).toHaveBeenCalledTimes(1)
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

      expect(jwt.sign).toHaveBeenCalledWith(
        mockNewUser.id,
        mockNewUser.email,
        mockNewUser.role,
        mockNewUser.status,
        1, // Default tokenVersion for new users
      )
      expect(jwt.sign).toHaveBeenCalledTimes(1)
      expect(result.token).toBeDefined()
      expect(result.token).toContain('mock-jwt')
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
    beforeEach(() => {
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

      mock.module('@/repositories', () => ({
        userRepo: {
          findByEmail: mock(() => Promise.resolve(existingUser)),
          create: mock(() => Promise.resolve(mockNewUser)),
        },
        authRepo: {
          create: mock(() => Promise.resolve()),
        },
        tokenRepo: {
          deprecateOld: mock(() => Promise.resolve()),
          create: mock(() => Promise.resolve()),
        },
      }))
    })

    it('should throw EmailAlreadyInUse error', async () => {
      try {
        await signUpWithEmail(mockSignupParams)
        expect(true).toBe(false) // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).code).toBe(ErrorCode.EmailAlreadyInUse)
      }

      expect(userRepo.findByEmail).toHaveBeenCalledWith(mockSignupParams.email)
      expect(userRepo.create).not.toHaveBeenCalled()
      expect(authRepo.create).not.toHaveBeenCalled()
      expect(tokenRepo.deprecateOld).not.toHaveBeenCalled()
      expect(tokenRepo.create).not.toHaveBeenCalled()
      expect(emailAgent.sendWelcomeEmail).not.toHaveBeenCalled()
    })
  })

  describe('when user creation fails', () => {
    beforeEach(() => {
      mock.module('@/repositories', () => ({
        userRepo: {
          findByEmail: mock(() => Promise.resolve(null)),
          create: mock(() => Promise.reject(new Error('Database connection failed'))),
        },
        authRepo: {
          create: mock(() => Promise.resolve()),
        },
        tokenRepo: {
          deprecateOld: mock(() => Promise.resolve()),
          create: mock(() => Promise.resolve()),
        },
      }))
    })

    it('should throw the error and not proceed with auth or token creation', async () => {
      try {
        await signUpWithEmail(mockSignupParams)
        expect(true).toBe(false) // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Database connection failed')
      }

      expect(userRepo.findByEmail).toHaveBeenCalledWith(mockSignupParams.email)
      expect(userRepo.create).toHaveBeenCalledTimes(1)
      expect(authRepo.create).not.toHaveBeenCalled()
      expect(tokenRepo.deprecateOld).not.toHaveBeenCalled()
      expect(tokenRepo.create).not.toHaveBeenCalled()
      expect(emailAgent.sendWelcomeEmail).not.toHaveBeenCalled()
    })
  })

  describe('when auth creation fails', () => {
    beforeEach(() => {
      mock.module('@/repositories', () => ({
        userRepo: {
          findByEmail: mock(() => Promise.resolve(null)),
          create: mock(() => Promise.resolve(mockNewUser)),
        },
        authRepo: {
          create: mock(() => Promise.reject(new Error('Auth table unavailable'))),
        },
        tokenRepo: {
          deprecateOld: mock(() => Promise.resolve()),
          create: mock(() => Promise.resolve()),
        },
      }))
    })

    it('should throw the error and not proceed with token creation', async () => {
      try {
        await signUpWithEmail(mockSignupParams)
        expect(true).toBe(false) // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Auth table unavailable')
      }

      expect(userRepo.findByEmail).toHaveBeenCalledWith(mockSignupParams.email)
      expect(userRepo.create).toHaveBeenCalledTimes(1)
      expect(authRepo.create).toHaveBeenCalledTimes(1)
      expect(tokenRepo.deprecateOld).not.toHaveBeenCalled()
      expect(tokenRepo.create).not.toHaveBeenCalled()
      expect(emailAgent.sendWelcomeEmail).not.toHaveBeenCalled()
    })
  })

  describe('when token creation fails', () => {
    beforeEach(() => {
      mock.module('@/repositories', () => ({
        userRepo: {
          findByEmail: mock(() => Promise.resolve(null)),
          create: mock(() => Promise.resolve(mockNewUser)),
        },
        authRepo: {
          create: mock(() => Promise.resolve()),
        },
        tokenRepo: {
          deprecateOld: mock(() => Promise.resolve()),
          create: mock(() => Promise.reject(new Error('Token creation failed'))),
        },
      }))
    })

    it('should throw the error and not send email', async () => {
      try {
        await signUpWithEmail(mockSignupParams)
        expect(true).toBe(false) // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Token creation failed')
      }

      expect(userRepo.findByEmail).toHaveBeenCalledWith(mockSignupParams.email)
      expect(userRepo.create).toHaveBeenCalledTimes(1)
      expect(authRepo.create).toHaveBeenCalledTimes(1)
      expect(tokenRepo.deprecateOld).toHaveBeenCalledTimes(1)
      expect(tokenRepo.create).toHaveBeenCalledTimes(1)
      expect(emailAgent.sendWelcomeEmail).not.toHaveBeenCalled()
    })
  })

  describe('when email sending fails', () => {
    beforeEach(() => {
      mock.module('@/lib/email-agent', () => ({
        emailAgent: {
          sendWelcomeEmail: mock(() => Promise.reject(new Error('Email service unavailable'))),
        },
      }))
    })

    it('should throw the email error after creating user, auth, and token', async () => {
      try {
        await signUpWithEmail(mockSignupParams)
        expect(true).toBe(false) // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Email service unavailable')
      }

      expect(userRepo.findByEmail).toHaveBeenCalledWith(mockSignupParams.email)
      expect(userRepo.create).toHaveBeenCalledTimes(1)
      expect(authRepo.create).toHaveBeenCalledTimes(1)
      expect(tokenRepo.deprecateOld).toHaveBeenCalledTimes(1)
      expect(tokenRepo.create).toHaveBeenCalledTimes(1)
      expect(emailAgent.sendWelcomeEmail).toHaveBeenCalledTimes(1)
    })
  })

  describe('edge cases', () => {
    it('should handle email with different cases', async () => {
      const uppercaseEmail = mockSignupParams.email.toUpperCase()
      const paramsWithUppercaseEmail = { ...mockSignupParams, email: uppercaseEmail }

      const result = await signUpWithEmail(paramsWithUppercaseEmail)

      expect(userRepo.findByEmail).toHaveBeenCalledWith(uppercaseEmail)
      expect(userRepo.create).toHaveBeenCalledWith({
        firstName: mockSignupParams.firstName,
        lastName: mockSignupParams.lastName,
        email: uppercaseEmail,
        role: mockSignupParams.role,
        status: Status.New,
      })
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
      mock.module('@/repositories', () => ({
        userRepo: {
          findByEmail: mock(() => Promise.resolve(null)),
          create: mock(() => Promise.resolve(userWithShortNames)),
        },
        authRepo: {
          create: mock(() => Promise.resolve()),
        },
        tokenRepo: {
          deprecateOld: mock(() => Promise.resolve()),
          create: mock(() => Promise.resolve()),
        },
      }))

      await signUpWithEmail(paramsWithShortNames)

      expect(userRepo.create).toHaveBeenCalledWith({
        firstName: 'Al',
        lastName: 'Bo',
        email: mockSignupParams.email,
        role: mockSignupParams.role,
        status: Status.New,
      })

      expect(emailAgent.sendWelcomeEmail).toHaveBeenCalledWith({
        firstName: 'Al',
        email: mockSignupParams.email,
        token: mockToken,
      })
    })

    it('should handle different user roles', async () => {
      const adminSignupParams = { ...mockSignupParams, role: Role.Admin }
      const adminUser = { ...mockNewUser, role: Role.Admin }

      mock.module('@/repositories', () => ({
        userRepo: {
          findByEmail: mock(() => Promise.resolve(null)),
          create: mock(() => Promise.resolve(adminUser)),
        },
        authRepo: {
          create: mock(() => Promise.resolve()),
        },
        tokenRepo: {
          deprecateOld: mock(() => Promise.resolve()),
          create: mock(() => Promise.resolve()),
        },
      }))

      const result = await signUpWithEmail(adminSignupParams)

      expect(userRepo.create).toHaveBeenCalledWith({
        firstName: mockSignupParams.firstName,
        lastName: mockSignupParams.lastName,
        email: mockSignupParams.email,
        role: Role.Admin,
        status: Status.New,
      })
      const { tokenVersion: _, ...expectedAdminUser } = adminUser
      expect(result.user).toEqual(expectedAdminUser)

      // Also verify no sensitive fields for admin users
      expect(result.user).not.toHaveProperty('tokenVersion')
      // createdAt and updatedAt are now included in the response
      expect(result.user).toHaveProperty('createdAt')
      expect(result.user).toHaveProperty('updatedAt')
    })

    it('should handle complex passwords', async () => {
      const complexPassword = 'VeryComplex@Password123!#$'
      const paramsWithComplexPassword = { ...mockSignupParams, password: complexPassword }

      await signUpWithEmail(paramsWithComplexPassword)

      // Note: We can't easily test the internal encoder.hash call
      // This test verifies that complex passwords are handled correctly
      expect(userRepo.create).toHaveBeenCalledTimes(1)
      expect(authRepo.create).toHaveBeenCalledWith({
        userId: mockNewUser.id,
        provider: AuthProvider.Local,
        identifier: mockSignupParams.email,
        passwordHash: mockHashedPassword,
      })
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

      expect(userRepo.create).toHaveBeenCalledWith({
        firstName: longFirstName,
        lastName: longLastName,
        email: mockSignupParams.email,
        role: mockSignupParams.role,
        status: Status.New,
      })
    })
  })

  describe('when password hashing fails', () => {
    beforeEach(() => {
      mock.module('@/lib/crypto', () => ({
        createPasswordEncoder: mock(() => ({
          hash: mock(() => Promise.reject(new Error('Crypto library error'))),
          compare: mock(() => Promise.resolve(true)),
        })),
      }))
    })

    it('should throw the crypto error and not proceed with auth creation', async () => {
      try {
        await signUpWithEmail(mockSignupParams)
        expect(true).toBe(false) // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Crypto library error')
      }

      expect(userRepo.findByEmail).toHaveBeenCalledWith(mockSignupParams.email)
      expect(userRepo.create).toHaveBeenCalledTimes(1)
      expect(authRepo.create).not.toHaveBeenCalled()
      expect(tokenRepo.deprecateOld).not.toHaveBeenCalled()
      expect(tokenRepo.create).not.toHaveBeenCalled()
      expect(emailAgent.sendWelcomeEmail).not.toHaveBeenCalled()
    })
  })

  describe('when token deprecation fails', () => {
    beforeEach(() => {
      mock.module('@/repositories', () => ({
        userRepo: {
          findByEmail: mock(() => Promise.resolve(null)),
          create: mock(() => Promise.resolve(mockNewUser)),
        },
        authRepo: {
          create: mock(() => Promise.resolve()),
        },
        tokenRepo: {
          deprecateOld: mock(() => Promise.reject(new Error('Token deprecation failed'))),
          create: mock(() => Promise.resolve()),
        },
      }))
    })

    it('should throw the error and not proceed with new token creation', async () => {
      try {
        await signUpWithEmail(mockSignupParams)
        expect(true).toBe(false) // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Token deprecation failed')
      }

      expect(userRepo.findByEmail).toHaveBeenCalledWith(mockSignupParams.email)
      expect(userRepo.create).toHaveBeenCalledTimes(1)
      expect(authRepo.create).toHaveBeenCalledTimes(1)
      expect(tokenRepo.deprecateOld).toHaveBeenCalledTimes(1)
      expect(tokenRepo.create).not.toHaveBeenCalled()
      expect(emailAgent.sendWelcomeEmail).not.toHaveBeenCalled()
    })
  })
})
