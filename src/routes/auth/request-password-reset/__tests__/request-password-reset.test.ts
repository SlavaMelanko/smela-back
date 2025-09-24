import { beforeEach, describe, expect, it, mock } from 'bun:test'

import { Role, Status, Token } from '@/types'

import requestPasswordReset from '../request-password-reset'

describe('Request Password Reset', () => {
  let mockUser: any
  let mockToken: string
  let mockExpiresAt: Date
  let mockEmailAgent: any
  let mockTokenRepo: any
  let mockUserRepo: any

  beforeEach(() => {
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

    mockToken = 'reset-token-123'

    mockExpiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000) // 1 hour

    mockUserRepo = {
      findByEmail: mock(() => Promise.resolve(mockUser)),
    }

    mockTokenRepo = {
      deprecateOld: mock(() => Promise.resolve()),
      create: mock(() => Promise.resolve()),
    }

    mockEmailAgent = {
      sendResetPasswordEmail: mock(() => Promise.resolve()),
    }

    mock.module('@/repositories', () => ({
      userRepo: mockUserRepo,
      tokenRepo: mockTokenRepo,
      authRepo: {},
    }))

    mock.module('@/lib/token', () => ({
      generateToken: mock(() => ({
        type: Token.PasswordReset,
        token: mockToken,
        expiresAt: mockExpiresAt,
      })),
    }))

    mock.module('@/lib/email-agent', () => ({
      emailAgent: mockEmailAgent,
    }))
  })

  describe('successful password reset request', () => {
    it('should deprecate old tokens and create a new password reset token', async () => {
      const result = await requestPasswordReset(mockUser.email)

      expect(mockTokenRepo.deprecateOld).toHaveBeenCalledWith(mockUser.id, Token.PasswordReset)
      expect(mockTokenRepo.deprecateOld).toHaveBeenCalledTimes(1)

      expect(mockTokenRepo.create).toHaveBeenCalledWith({
        userId: mockUser.id,
        type: Token.PasswordReset,
        token: mockToken,
        expiresAt: mockExpiresAt,
      })
      expect(mockTokenRepo.create).toHaveBeenCalledTimes(1)

      expect(result).toEqual({ success: true })
    })

    it('should send a reset password email with the new token', async () => {
      await requestPasswordReset(mockUser.email)

      expect(mockEmailAgent.sendResetPasswordEmail).toHaveBeenCalledWith({
        firstName: mockUser.firstName,
        email: mockUser.email,
        token: mockToken,
      })
      expect(mockEmailAgent.sendResetPasswordEmail).toHaveBeenCalledTimes(1)
    })
  })

  describe('user not found scenarios', () => {
    beforeEach(() => {
      mockUserRepo.findByEmail.mockImplementation(() => Promise.resolve(null))
    })

    it('should return success response to prevent email enumeration', async () => {
      const result = await requestPasswordReset('nonexistent@example.com')

      expect(result).toEqual({ success: true })
      expect(mockTokenRepo.deprecateOld).not.toHaveBeenCalled()
      expect(mockTokenRepo.create).not.toHaveBeenCalled()
      expect(mockEmailAgent.sendResetPasswordEmail).not.toHaveBeenCalled()
    })
  })

  describe('inactive user scenarios', () => {
    const inactiveStatuses = [Status.New, Status.Suspended, Status.Archived]

    inactiveStatuses.forEach((status) => {
      describe(`when user status is ${status}`, () => {
        beforeEach(() => {
          const inactiveUser = { ...mockUser, status }
          mockUserRepo.findByEmail.mockImplementation(() => Promise.resolve(inactiveUser))
        })

        it('should return success response to prevent email enumeration', async () => {
          const result = await requestPasswordReset(mockUser.email)

          expect(result).toEqual({ success: true })
          expect(mockTokenRepo.deprecateOld).not.toHaveBeenCalled()
          expect(mockTokenRepo.create).not.toHaveBeenCalled()
          expect(mockEmailAgent.sendResetPasswordEmail).not.toHaveBeenCalled()
        })
      })
    })
  })

  describe('token creation failure scenarios', () => {
    beforeEach(() => {
      mockUserRepo.findByEmail.mockImplementation(() => Promise.resolve(mockUser))
      mockTokenRepo.create.mockImplementation(() => Promise.reject(new Error('Database connection failed')))
    })

    it('should throw the error and not send email', async () => {
      try {
        await requestPasswordReset(mockUser.email)
        expect(true).toBe(false) // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Database connection failed')
      }

      expect(mockTokenRepo.deprecateOld).toHaveBeenCalledTimes(1)
      expect(mockTokenRepo.create).toHaveBeenCalledTimes(1)
      expect(mockEmailAgent.sendResetPasswordEmail).not.toHaveBeenCalled()
    })
  })

  describe('edge cases and boundary conditions', () => {
    it('should handle email with different cases', async () => {
      const uppercaseEmail = mockUser.email.toUpperCase()
      await requestPasswordReset(uppercaseEmail)

      expect(mockUserRepo.findByEmail).toHaveBeenCalledWith(uppercaseEmail)
      expect(mockEmailAgent.sendResetPasswordEmail).toHaveBeenCalledWith({
        firstName: mockUser.firstName,
        email: mockUser.email,
        token: mockToken,
      })
    })

    it('should handle users with minimal names', async () => {
      const userWithShortName = { ...mockUser, firstName: 'A', lastName: 'B' }
      mockUserRepo.findByEmail.mockImplementation(() => Promise.resolve(userWithShortName))

      await requestPasswordReset(mockUser.email)

      expect(mockEmailAgent.sendResetPasswordEmail).toHaveBeenCalledWith({
        firstName: 'A',
        email: mockUser.email,
        token: mockToken,
      })
    })
  })

  describe('email sending failure scenarios', () => {
    beforeEach(() => {
      mockEmailAgent.sendResetPasswordEmail.mockImplementation(() => Promise.reject(new Error('Email service unavailable')))
    })

    it('should complete successfully even if email fails', async () => {
      const result = await requestPasswordReset(mockUser.email)

      expect(result).toEqual({ success: true })

      expect(mockTokenRepo.deprecateOld).toHaveBeenCalledTimes(1)
      expect(mockTokenRepo.create).toHaveBeenCalledTimes(1)
      expect(mockEmailAgent.sendResetPasswordEmail).toHaveBeenCalledTimes(1)
    })
  })

  describe('token deprecation failure scenarios', () => {
    beforeEach(() => {
      mockUserRepo.findByEmail.mockImplementation(() => Promise.resolve(mockUser))
      mockTokenRepo.deprecateOld.mockImplementation(() => Promise.reject(new Error('Database connection failed')))
    })

    it('should throw the error and not proceed with token creation or email', async () => {
      try {
        await requestPasswordReset(mockUser.email)
        expect(true).toBe(false) // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Database connection failed')
      }

      expect(mockTokenRepo.deprecateOld).toHaveBeenCalledTimes(1)
      expect(mockTokenRepo.create).not.toHaveBeenCalled()
      expect(mockEmailAgent.sendResetPasswordEmail).not.toHaveBeenCalled()
    })
  })
})
