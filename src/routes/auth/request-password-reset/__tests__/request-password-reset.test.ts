import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import { ModuleMocker } from '@/__tests__'
import { Role, Status, Token } from '@/types'

import requestPasswordReset from '../request-password-reset'

describe('Request Password Reset', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockUser: any

  let mockUserRepo: any
  let mockTokenRepo: any
  let mockDb: any

  let mockToken: string
  let mockExpiresAt: Date

  let mockEmailAgent: any

  beforeEach(async () => {
    mockUser = {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      status: Status.Verified,
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
    mockDb = {
      transaction: mock(async (callback: any) => callback({})),
    }

    await moduleMocker.mock('@/data', () => ({
      userRepo: mockUserRepo,
      tokenRepo: mockTokenRepo,
      authRepo: {},
      db: mockDb,
    }))

    mockToken = 'reset-token-123'
    mockExpiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000) // 1 hour

    await moduleMocker.mock('@/lib/token', () => ({
      generateToken: mock(() => ({
        type: Token.PasswordReset,
        token: mockToken,
        expiresAt: mockExpiresAt,
      })),
    }))

    mockEmailAgent = {
      sendResetPasswordEmail: mock(() => Promise.resolve()),
    }

    await moduleMocker.mock('@/lib/email-agent', () => ({
      emailAgent: mockEmailAgent,
    }))
  })

  afterEach(() => {
    moduleMocker.clear()
  })

  describe('successful password reset request', () => {
    it('should replace token and send reset email', async () => {
      const result = await requestPasswordReset(mockUser.email)

      expect(mockDb.transaction).toHaveBeenCalledTimes(1)

      // Replace token should be called
      expect(mockTokenRepo.replace).toHaveBeenCalledWith(mockUser.id, {
        userId: mockUser.id,
        type: Token.PasswordReset,
        token: mockToken,
        expiresAt: mockExpiresAt,
      }, {})
      expect(mockTokenRepo.replace).toHaveBeenCalledTimes(1)

      // Send reset email
      expect(mockEmailAgent.sendResetPasswordEmail).toHaveBeenCalledWith({
        firstName: mockUser.firstName,
        email: mockUser.email,
        token: mockToken,
      })
      expect(mockEmailAgent.sendResetPasswordEmail).toHaveBeenCalledTimes(1)

      expect(result).toEqual({ success: true })
    })

    it('should return success when user not found', async () => {
      mockUserRepo.findByEmail.mockImplementation(() => Promise.resolve(null))

      const result = await requestPasswordReset('nonexistent@example.com')

      expect(result).toEqual({ success: true })
      expect(mockTokenRepo.replace).not.toHaveBeenCalled()
      expect(mockEmailAgent.sendResetPasswordEmail).not.toHaveBeenCalled()
    })
  })

  describe('non-active user scenarios', () => {
    const inactiveStatuses = [Status.New, Status.Suspended, Status.Archived]

    inactiveStatuses.forEach((status) => {
      it(`should return success when user status is ${status}`, async () => {
        const inactiveUser = { ...mockUser, status }
        mockUserRepo.findByEmail.mockImplementation(() => Promise.resolve(inactiveUser))

        const result = await requestPasswordReset(mockUser.email)

        expect(result).toEqual({ success: true })
        expect(mockTokenRepo.replace).not.toHaveBeenCalled()
        expect(mockEmailAgent.sendResetPasswordEmail).not.toHaveBeenCalled()
      })
    })
  })

  describe('token operation failure scenarios', () => {
    it('should throw error when token replacement fails and not send email', async () => {
      mockUserRepo.findByEmail.mockImplementation(() => Promise.resolve(mockUser))
      mockTokenRepo.replace.mockImplementation(() => Promise.reject(new Error('Database connection failed')))

      try {
        await requestPasswordReset(mockUser.email)
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Database connection failed')
      }

      expect(mockTokenRepo.replace).toHaveBeenCalledTimes(1)
      expect(mockEmailAgent.sendResetPasswordEmail).not.toHaveBeenCalled()
    })
  })

  describe('email sending failure scenarios', () => {
    beforeEach(async () => {
      mockEmailAgent.sendResetPasswordEmail.mockImplementation(() => Promise.reject(new Error('Email service unavailable')))
    })

    it('should complete successfully even if email fails', async () => {
      const result = await requestPasswordReset(mockUser.email)

      expect(result).toEqual({ success: true })

      expect(mockTokenRepo.replace).toHaveBeenCalledTimes(1)
      expect(mockEmailAgent.sendResetPasswordEmail).toHaveBeenCalledTimes(1)
    })
  })
})
