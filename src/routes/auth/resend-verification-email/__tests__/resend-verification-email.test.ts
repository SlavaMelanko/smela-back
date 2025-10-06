import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import { ModuleMocker } from '@/__tests__'
import { Role, Status, Token } from '@/types'

import resendVerificationEmail from '../resend-verification-email'

describe('Resend Verification Email', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockUser: any
  let mockUserRepo: any
  let mockTokenRepo: any
  let mockTransaction: any

  let mockTokenString: string
  let mockExpiresAt: Date
  let mockGenerateToken: any

  let mockEmailAgent: any

  beforeEach(async () => {
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

    mockUserRepo = {
      findByEmail: mock(() => Promise.resolve(mockUser)),
    }
    mockTokenRepo = {
      replace: mock(() => Promise.resolve()),
    }
    mockTransaction = {
      transaction: mock(async (callback: any) => callback({})),
    }

    await moduleMocker.mock('@/data', () => ({
      userRepo: mockUserRepo,
      tokenRepo: mockTokenRepo,
      db: mockTransaction,
    }))

    mockTokenString = 'mock-resend-verification-token-123'
    mockExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
    mockGenerateToken = mock(() => ({
      type: Token.EmailVerification,
      token: mockTokenString,
      expiresAt: mockExpiresAt,
    }))

    await moduleMocker.mock('@/lib/token', () => ({
      generateToken: mockGenerateToken,
    }))

    mockEmailAgent = {
      sendWelcomeEmail: mock(() => Promise.resolve()),
    }

    await moduleMocker.mock('@/lib/email-agent', () => ({
      emailAgent: mockEmailAgent,
    }))
  })

  afterEach(() => {
    moduleMocker.clear()
  })

  describe('when user exists and is not verified', () => {
    it('should replace token with new verification token', async () => {
      const result = await resendVerificationEmail(mockUser.email)

      expect(mockTransaction.transaction).toHaveBeenCalledTimes(1)

      expect(mockTokenRepo.replace).toHaveBeenCalledWith(mockUser.id, {
        userId: mockUser.id,
        type: Token.EmailVerification,
        token: mockTokenString,
        expiresAt: mockExpiresAt,
      }, {})
      expect(mockTokenRepo.replace).toHaveBeenCalledTimes(1)

      expect(result).toEqual({ success: true })
    })

    it('should send a welcome email with the new token', async () => {
      await resendVerificationEmail(mockUser.email)

      expect(mockEmailAgent.sendWelcomeEmail).toHaveBeenCalledWith({
        firstName: mockUser.firstName,
        email: mockUser.email,
        token: mockTokenString,
      })
      expect(mockEmailAgent.sendWelcomeEmail).toHaveBeenCalledTimes(1)
    })
  })

  describe('when user does not exist', () => {
    it('should return success response to prevent email enumeration', async () => {
      mockUserRepo.findByEmail.mockImplementation(() => Promise.resolve(null))

      const result = await resendVerificationEmail('nonexistent@example.com')

      expect(result).toEqual({ success: true })
      expect(mockTokenRepo.replace).not.toHaveBeenCalled()
      expect(mockEmailAgent.sendWelcomeEmail).not.toHaveBeenCalled()
    })
  })

  describe('when user is already verified', () => {
    it('should return success response to prevent email enumeration', async () => {
      const verifiedUser = {
        ...mockUser,
        status: Status.Verified,
      }

      mockUserRepo.findByEmail.mockImplementation(() => Promise.resolve(verifiedUser))

      const result = await resendVerificationEmail(verifiedUser.email)

      expect(result).toEqual({ success: true })
      expect(mockTokenRepo.replace).not.toHaveBeenCalled()
      expect(mockEmailAgent.sendWelcomeEmail).not.toHaveBeenCalled()
    })
  })

  describe('when user is suspended', () => {
    it('should return success response to prevent email enumeration', async () => {
      const suspendedUser = {
        ...mockUser,
        status: Status.Suspended,
      }

      mockUserRepo.findByEmail.mockImplementation(() => Promise.resolve(suspendedUser))

      const result = await resendVerificationEmail(suspendedUser.email)

      expect(result).toEqual({ success: true })
      expect(mockTokenRepo.replace).not.toHaveBeenCalled()
      expect(mockEmailAgent.sendWelcomeEmail).not.toHaveBeenCalled()
    })
  })

  describe('when token replacement fails', () => {
    it('should throw the error and not send email', async () => {
      mockTokenRepo.replace.mockImplementation(() => Promise.reject(new Error('Database error')))

      try {
        await resendVerificationEmail(mockUser.email)
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Database error')
      }

      expect(mockTokenRepo.replace).toHaveBeenCalled()
      expect(mockEmailAgent.sendWelcomeEmail).not.toHaveBeenCalled()
    })
  })

  describe('edge cases', () => {
    it('should handle email with different cases', async () => {
      const upperCaseEmail = 'JOHN@EXAMPLE.COM'
      const result = await resendVerificationEmail(upperCaseEmail)

      expect(mockUserRepo.findByEmail).toHaveBeenCalledWith(upperCaseEmail)
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

        mockUserRepo.findByEmail.mockImplementation(() => Promise.resolve(userWithStatus))

        const result = await resendVerificationEmail(userWithStatus.email)

        expect(result).toEqual({ success: true })
        expect(mockTokenRepo.replace).not.toHaveBeenCalled()
        expect(mockEmailAgent.sendWelcomeEmail).not.toHaveBeenCalled()
      }
    })
  })

  describe('when email sending fails', () => {
    it('should complete successfully even if email fails', async () => {
      mockEmailAgent.sendWelcomeEmail.mockImplementation(() => Promise.reject(new Error('Email service unavailable')))

      const result = await resendVerificationEmail(mockUser.email)

      expect(result).toEqual({ success: true })

      expect(mockTokenRepo.replace).toHaveBeenCalled()
      expect(mockEmailAgent.sendWelcomeEmail).toHaveBeenCalled()
    })
  })

  describe('when replace fails due to transaction error', () => {
    it('should throw the error and not send email', async () => {
      mockTokenRepo.replace.mockImplementation(() => Promise.reject(new Error('Database connection failed')))

      try {
        await resendVerificationEmail(mockUser.email)
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Database connection failed')
      }

      expect(mockTokenRepo.replace).toHaveBeenCalled()
      expect(mockEmailAgent.sendWelcomeEmail).not.toHaveBeenCalled()
    })
  })
})
