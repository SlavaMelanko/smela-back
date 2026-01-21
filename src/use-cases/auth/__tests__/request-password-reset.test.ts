import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import type { User } from '@/data'

import { ModuleMocker } from '@/__tests__'
import { TokenType } from '@/security/token'
import { Role, Status } from '@/types'
import { hour, nowPlus } from '@/utils/chrono'

import requestPasswordReset from '../request-password-reset'

describe('Request Password Reset', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockUser: User

  let mockUserRepo: any
  let mockTokenRepo: any
  let mockTransaction: any

  let mockTokenString: string
  let mockExpiresAt: Date

  let mockEmailAgent: any

  beforeEach(async () => {
    mockUser = {
      id: '550e8400-e29b-41d4-a716-446655440001',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      status: Status.Verified,
      role: Role.User,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    mockUserRepo = {
      findByEmail: mock(async () => mockUser),
    }
    mockTokenRepo = {
      issue: mock(async () => {}),
    }
    mockTransaction = {
      transaction: mock(async (callback: any) => callback({}) as Promise<void>),
    }

    await moduleMocker.mock('@/data', () => ({
      userRepo: mockUserRepo,
      tokenRepo: mockTokenRepo,
      authRepo: {},
      db: mockTransaction,
    }))

    mockTokenString = 'reset-token-123'
    mockExpiresAt = nowPlus(hour())

    await moduleMocker.mock('@/security/token', () => ({
      generateToken: mock(() => ({
        type: TokenType.PasswordReset,
        token: mockTokenString,
        expiresAt: mockExpiresAt,
      })),
    }))

    mockEmailAgent = {
      sendResetPasswordEmail: mock(async () => {}),
    }

    await moduleMocker.mock('@/services', () => ({
      emailAgent: mockEmailAgent,
    }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  describe('successful password reset request', () => {
    it('should replace token and send reset email', async () => {
      const result = await requestPasswordReset({ email: mockUser.email })

      expect(mockTransaction.transaction).toHaveBeenCalledTimes(1)

      // Replace token should be called
      expect(mockTokenRepo.issue).toHaveBeenCalledWith(mockUser.id, {
        userId: mockUser.id,
        type: TokenType.PasswordReset,
        token: mockTokenString,
        expiresAt: mockExpiresAt,
      }, {})
      expect(mockTokenRepo.issue).toHaveBeenCalledTimes(1)

      // Send reset email
      expect(mockEmailAgent.sendResetPasswordEmail).toHaveBeenCalledWith(
        mockUser.firstName,
        mockUser.email,
        mockTokenString,
        undefined,
      )
      expect(mockEmailAgent.sendResetPasswordEmail).toHaveBeenCalledTimes(1)

      expect(result).toEqual({ data: { success: true } })
    })

    it('should return success when user not found', async () => {
      mockUserRepo.findByEmail.mockImplementation(async () => null)

      const result = await requestPasswordReset({ email: 'nonexistent@example.com' })

      expect(result).toEqual({ data: { success: true } })
      expect(mockTokenRepo.issue).not.toHaveBeenCalled()
      expect(mockEmailAgent.sendResetPasswordEmail).not.toHaveBeenCalled()
    })
  })

  describe('non-active user scenarios', () => {
    const inactiveStatuses = [Status.New, Status.Suspended, Status.Archived]

    inactiveStatuses.forEach((status) => {
      it(`should return success when user status is ${status}`, async () => {
        const inactiveUser = { ...mockUser, status }
        mockUserRepo.findByEmail.mockImplementation(async () => inactiveUser)

        const result = await requestPasswordReset({ email: mockUser.email })

        expect(result).toEqual({ data: { success: true } })
        expect(mockTokenRepo.issue).not.toHaveBeenCalled()
        expect(mockEmailAgent.sendResetPasswordEmail).not.toHaveBeenCalled()
      })
    })
  })

  describe('token operation failure scenarios', () => {
    it('should throw error when token replacement fails and not send email', async () => {
      mockUserRepo.findByEmail.mockImplementation(async () => mockUser)
      mockTokenRepo.issue.mockImplementation(async () => {
        throw new Error('Database connection failed')
      })

      try {
        await requestPasswordReset({ email: mockUser.email })
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Database connection failed')
      }

      expect(mockTokenRepo.issue).toHaveBeenCalledTimes(1)
      expect(mockEmailAgent.sendResetPasswordEmail).not.toHaveBeenCalled()
    })
  })

  describe('email sending failure scenarios', () => {
    it('should complete successfully even if email fails', async () => {
      mockEmailAgent.sendResetPasswordEmail.mockImplementation(async () => {
        throw new Error('Email service unavailable')
      })

      const result = await requestPasswordReset({ email: mockUser.email })

      expect(result).toEqual({ data: { success: true } })

      expect(mockTokenRepo.issue).toHaveBeenCalledTimes(1)
      expect(mockEmailAgent.sendResetPasswordEmail).toHaveBeenCalledTimes(1)
    })
  })
})
