import { beforeEach, describe, expect, it, mock } from 'bun:test'

import { emailAgent } from '@/lib/email-agent'
import { tokenRepo, userRepo } from '@/repositories'
import { Role, Status, Token } from '@/types'

import resendVerificationEmail from '../resend-verification-email'

describe('resendVerificationEmail', () => {
  let mockUser: any
  let mockToken: string
  let mockExpiresAt: Date

  beforeEach(() => {
    mockUser = {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      status: Status.New,
      role: Role.User,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    mockToken = 'mock-resend-verification-token-123'
    mockExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    mock.module('@/repositories', () => ({
      userRepo: {
        findByEmail: mock(() => Promise.resolve(mockUser)),
      },
      tokenRepo: {
        deprecateOld: mock(() => Promise.resolve()),
        create: mock(() => Promise.resolve()),
      },
      authRepo: {},
    }))

    mock.module('@/lib/token', () => ({
      generateToken: mock(() => ({
        type: Token.EmailVerification,
        token: mockToken,
        expiresAt: mockExpiresAt,
      })),
      EMAIL_VERIFICATION_EXPIRY_HOURS: 48,
    }))

    mock.module('@/lib/email-agent', () => ({
      emailAgent: {
        sendWelcomeEmail: mock(() => Promise.resolve()),
      },
    }))
  })

  describe('when user exists and is not verified', () => {
    it('should deprecate old tokens and create a new verification token', async () => {
      const result = await resendVerificationEmail(mockUser.email)

      expect(tokenRepo.deprecateOld).toHaveBeenCalledWith(mockUser.id, Token.EmailVerification)
      expect(tokenRepo.deprecateOld).toHaveBeenCalledTimes(1)

      expect(tokenRepo.create).toHaveBeenCalledWith({
        userId: mockUser.id,
        type: Token.EmailVerification,
        token: mockToken,
        expiresAt: mockExpiresAt,
      })
      expect(tokenRepo.create).toHaveBeenCalledTimes(1)

      expect(result).toEqual({ success: true })
    })

    it('should send a welcome email with the new token', async () => {
      await resendVerificationEmail(mockUser.email)

      expect(emailAgent.sendWelcomeEmail).toHaveBeenCalledWith({
        firstName: mockUser.firstName,
        email: mockUser.email,
        token: mockToken,
      })
      expect(emailAgent.sendWelcomeEmail).toHaveBeenCalledTimes(1)
    })
  })

  describe('when user does not exist', () => {
    beforeEach(() => {
      mock.module('@/repositories', () => ({
        userRepo: {
          findByEmail: mock(() => Promise.resolve(null)),
        },
        tokenRepo: {
          deprecateOld: mock(() => Promise.resolve()),
          create: mock(() => Promise.resolve()),
        },
        authRepo: {},
      }))
    })

    it('should return success response to prevent email enumeration', async () => {
      const result = await resendVerificationEmail('nonexistent@example.com')

      expect(result).toEqual({ success: true })
      expect(tokenRepo.deprecateOld).not.toHaveBeenCalled()
      expect(tokenRepo.create).not.toHaveBeenCalled()
      expect(emailAgent.sendWelcomeEmail).not.toHaveBeenCalled()
    })
  })

  describe('when user is already verified', () => {
    const verifiedUser = {
      ...mockUser,
      status: Status.Verified,
    }

    beforeEach(() => {
      mock.module('@/repositories', () => ({
        userRepo: {
          findByEmail: mock(() => Promise.resolve(verifiedUser)),
        },
        tokenRepo: {
          deprecateOld: mock(() => Promise.resolve()),
          create: mock(() => Promise.resolve()),
        },
        authRepo: {},
      }))
    })

    it('should return success response to prevent email enumeration', async () => {
      const result = await resendVerificationEmail(verifiedUser.email)

      expect(result).toEqual({ success: true })
      expect(tokenRepo.deprecateOld).not.toHaveBeenCalled()
      expect(tokenRepo.create).not.toHaveBeenCalled()
      expect(emailAgent.sendWelcomeEmail).not.toHaveBeenCalled()
    })
  })

  describe('when user is suspended', () => {
    const suspendedUser = {
      ...mockUser,
      status: Status.Suspended,
    }

    beforeEach(() => {
      mock.module('@/repositories', () => ({
        userRepo: {
          findByEmail: mock(() => Promise.resolve(suspendedUser)),
        },
        tokenRepo: {
          deprecateOld: mock(() => Promise.resolve()),
          create: mock(() => Promise.resolve()),
        },
        authRepo: {},
      }))
    })

    it('should return success response to prevent email enumeration', async () => {
      const result = await resendVerificationEmail(suspendedUser.email)

      expect(result).toEqual({ success: true })
      expect(tokenRepo.deprecateOld).not.toHaveBeenCalled()
      expect(tokenRepo.create).not.toHaveBeenCalled()
      expect(emailAgent.sendWelcomeEmail).not.toHaveBeenCalled()
    })
  })

  describe('when token creation fails', () => {
    beforeEach(() => {
      mock.module('@/repositories', () => ({
        userRepo: {
          findByEmail: mock(() => Promise.resolve(mockUser)),
        },
        tokenRepo: {
          deprecateOld: mock(() => Promise.resolve()),
          create: mock(() => Promise.reject(new Error('Database error'))),
        },
        authRepo: {},
      }))
    })

    it('should throw the error and not send email', async () => {
      try {
        await resendVerificationEmail(mockUser.email)
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Database error')
      }

      expect(tokenRepo.deprecateOld).toHaveBeenCalled()
      expect(emailAgent.sendWelcomeEmail).not.toHaveBeenCalled()
    })
  })

  describe('edge cases', () => {
    it('should handle email with different cases', async () => {
      const upperCaseEmail = 'JOHN@EXAMPLE.COM'
      const result = await resendVerificationEmail(upperCaseEmail)

      expect(userRepo.findByEmail).toHaveBeenCalledWith(upperCaseEmail)
      expect(result.success).toBe(true)
    })

    it('should reject users with ineligible statuses to prevent enumeration', async () => {
      const ineligibleStatuses = [
        Status.Trial,
        Status.Active,
        Status.Archived,
        Status.Pending,
      ]

      for (const status of ineligibleStatuses) {
        const userWithStatus = { ...mockUser, status }

        mock.module('@/repositories', () => ({
          userRepo: {
            findByEmail: mock(() => Promise.resolve(userWithStatus)),
          },
          tokenRepo: {
            deprecateOld: mock(() => Promise.resolve()),
            create: mock(() => Promise.resolve()),
          },
          authRepo: {},
        }))

        const result = await resendVerificationEmail(userWithStatus.email)

        expect(result).toEqual({ success: true })
        expect(tokenRepo.deprecateOld).not.toHaveBeenCalled()
        expect(tokenRepo.create).not.toHaveBeenCalled()
        expect(emailAgent.sendWelcomeEmail).not.toHaveBeenCalled()
      }
    })
  })

  describe('when email sending fails', () => {
    beforeEach(() => {
      mock.module('@/repositories', () => ({
        userRepo: {
          findByEmail: mock(() => Promise.resolve(mockUser)),
        },
        tokenRepo: {
          deprecateOld: mock(() => Promise.resolve()),
          create: mock(() => Promise.resolve()),
        },
        authRepo: {},
      }))

      mock.module('@/lib/email-agent', () => ({
        emailAgent: {
          sendWelcomeEmail: mock(() => Promise.reject(new Error('Email service unavailable'))),
        },
      }))
    })

    it('should throw the email error after creating token', async () => {
      try {
        await resendVerificationEmail(mockUser.email)
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Email service unavailable')
      }

      expect(tokenRepo.deprecateOld).toHaveBeenCalled()
      expect(tokenRepo.create).toHaveBeenCalled()
      expect(emailAgent.sendWelcomeEmail).toHaveBeenCalled()
    })
  })

  describe('when deprecateOld fails', () => {
    beforeEach(() => {
      mock.module('@/repositories', () => ({
        userRepo: {
          findByEmail: mock(() => Promise.resolve(mockUser)),
        },
        tokenRepo: {
          deprecateOld: mock(() => Promise.reject(new Error('Database connection failed'))),
          create: mock(() => Promise.resolve()),
        },
        authRepo: {},
      }))
    })

    it('should throw the error and not proceed with token creation or email', async () => {
      try {
        await resendVerificationEmail(mockUser.email)
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Database connection failed')
      }

      expect(tokenRepo.deprecateOld).toHaveBeenCalled()
      expect(tokenRepo.create).not.toHaveBeenCalled()
      expect(emailAgent.sendWelcomeEmail).not.toHaveBeenCalled()
    })
  })
})
