import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import type { User } from '@/data'

import { ModuleMocker } from '@/__tests__'
import { TokenType } from '@/security/token'
import { Role, Status } from '@/types'
import { hours, nowPlus } from '@/utils/chrono'

import resendVerificationEmail from '../resend-verification-email'

describe('Resend Verification Email', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockUser: User
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
      findByEmail: mock(async () => mockUser),
    }
    mockTokenRepo = {
      replace: mock(async () => {}),
    }
    mockTransaction = {
      transaction: mock(async (callback: any) => callback({}) as Promise<void>),
    }

    await moduleMocker.mock('@/data', () => ({
      userRepo: mockUserRepo,
      tokenRepo: mockTokenRepo,
      db: mockTransaction,
    }))

    mockTokenString = 'mock-resend-verification-token-123'
    mockExpiresAt = nowPlus(hours(24))
    mockGenerateToken = mock(() => ({
      type: TokenType.EmailVerification,
      token: mockTokenString,
      expiresAt: mockExpiresAt,
    }))

    await moduleMocker.mock('@/security/token', () => ({
      generateToken: mockGenerateToken,
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

  describe('when user exists and is not verified', () => {
    it('should replace token with new verification token', async () => {
      const result = await resendVerificationEmail({ email: mockUser.email })

      expect(mockTransaction.transaction).toHaveBeenCalledTimes(1)

      expect(mockTokenRepo.replace).toHaveBeenCalledWith(mockUser.id, {
        userId: mockUser.id,
        type: TokenType.EmailVerification,
        token: mockTokenString,
        expiresAt: mockExpiresAt,
      }, {})
      expect(mockTokenRepo.replace).toHaveBeenCalledTimes(1)

      expect(result).toEqual({ data: { success: true } })
    })

    it('should send an email verification email with the new token', async () => {
      await resendVerificationEmail({ email: mockUser.email })

      expect(mockEmailAgent.sendEmailVerificationEmail).toHaveBeenCalledWith(
        mockUser.firstName,
        mockUser.email,
        mockTokenString,
        undefined,
      )
      expect(mockEmailAgent.sendEmailVerificationEmail).toHaveBeenCalledTimes(1)
    })
  })

  describe('when user does not exist', () => {
    it('should return success response to prevent email enumeration', async () => {
      mockUserRepo.findByEmail.mockImplementation(async () => null)

      const result = await resendVerificationEmail({ email: 'nonexistent@example.com' })

      expect(result).toEqual({ data: { success: true } })
      expect(mockTokenRepo.replace).not.toHaveBeenCalled()
      expect(mockEmailAgent.sendEmailVerificationEmail).not.toHaveBeenCalled()
    })
  })

  describe('when user is already verified', () => {
    it('should return success response to prevent email enumeration', async () => {
      const verifiedUser = {
        ...mockUser,
        status: Status.Verified,
      }

      mockUserRepo.findByEmail.mockImplementation(async () => verifiedUser)

      const result = await resendVerificationEmail({ email: verifiedUser.email })

      expect(result).toEqual({ data: { success: true } })
      expect(mockTokenRepo.replace).not.toHaveBeenCalled()
      expect(mockEmailAgent.sendEmailVerificationEmail).not.toHaveBeenCalled()
    })
  })

  describe('when user is suspended', () => {
    it('should return success response to prevent email enumeration', async () => {
      const suspendedUser = {
        ...mockUser,
        status: Status.Suspended,
      }

      mockUserRepo.findByEmail.mockImplementation(async () => suspendedUser)

      const result = await resendVerificationEmail({ email: suspendedUser.email })

      expect(result).toEqual({ data: { success: true } })
      expect(mockTokenRepo.replace).not.toHaveBeenCalled()
      expect(mockEmailAgent.sendEmailVerificationEmail).not.toHaveBeenCalled()
    })
  })

  describe('when token replacement fails', () => {
    it('should throw the error and not send email', async () => {
      mockTokenRepo.replace.mockImplementation(async () => {
        throw new Error('Database error')
      })

      try {
        await resendVerificationEmail({ email: mockUser.email })
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Database error')
      }

      expect(mockTokenRepo.replace).toHaveBeenCalled()
      expect(mockEmailAgent.sendEmailVerificationEmail).not.toHaveBeenCalled()
    })
  })

  describe('edge cases', () => {
    it('should handle email with different cases', async () => {
      const upperCaseEmail = 'JOHN@EXAMPLE.COM'
      const result = await resendVerificationEmail({ email: upperCaseEmail })

      expect(mockUserRepo.findByEmail).toHaveBeenCalledWith(upperCaseEmail)
      expect(result.data.success).toBe(true)
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

        mockUserRepo.findByEmail.mockImplementation(async () => userWithStatus)

        const result = await resendVerificationEmail({ email: userWithStatus.email })

        expect(result).toEqual({ data: { success: true } })
        expect(mockTokenRepo.replace).not.toHaveBeenCalled()
        expect(mockEmailAgent.sendEmailVerificationEmail).not.toHaveBeenCalled()
      }
    })
  })

  describe('when email sending fails', () => {
    it('should complete successfully even if email fails', async () => {
      mockEmailAgent.sendEmailVerificationEmail.mockImplementation(async () => {
        throw new Error('Email service unavailable')
      })

      const result = await resendVerificationEmail({ email: mockUser.email })

      expect(result).toEqual({ data: { success: true } })

      expect(mockTokenRepo.replace).toHaveBeenCalled()
      expect(mockEmailAgent.sendEmailVerificationEmail).toHaveBeenCalled()
    })
  })

  describe('when replace fails due to transaction error', () => {
    it('should throw the error and not send email', async () => {
      mockTokenRepo.replace.mockImplementation(async () => {
        throw new Error('Database connection failed')
      })

      try {
        await resendVerificationEmail({ email: mockUser.email })
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Database connection failed')
      }

      expect(mockTokenRepo.replace).toHaveBeenCalled()
      expect(mockEmailAgent.sendEmailVerificationEmail).not.toHaveBeenCalled()
    })
  })
})
