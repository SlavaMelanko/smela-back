import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import type { TokenRecord, User } from '@/data'
import type { DeviceInfo } from '@/net/http/device'

import { ModuleMocker } from '@/__tests__'
import { AppError, ErrorCode } from '@/errors'
import { TOKEN_LENGTH, TokenStatus, TokenType } from '@/security/token'
import Role from '@/types/role'
import Status from '@/types/status'
import { hour, nowPlus } from '@/utils/chrono'

import acceptInvite from '../accept-invite'

describe('Accept Invite', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockPassword: string
  let mockDeviceInfo: DeviceInfo

  let mockTokenString: string
  let mockTokenRecord: TokenRecord
  let mockTokenRepo: any
  let mockAuthRepo: any
  let mockUserRepo: any
  let mockRefreshTokenRepo: any
  let mockTransaction: any

  let mockTokenValidator: any
  let mockGenerateHashedToken: any

  let mockHashedPassword: string
  let mockHashPassword: any

  let mockUser: User
  let mockActivatedUser: User
  let mockAccessToken: string
  let mockRefreshToken: string
  let mockSignJwt: any

  beforeEach(async () => {
    mockPassword = 'NewSecure@123'
    mockDeviceInfo = { ipAddress: '127.0.0.1', userAgent: 'test-agent' }

    mockTokenString = `mock-invite-token-${'1'.repeat(TOKEN_LENGTH - 18)}`
    mockTokenRecord = {
      id: 1,
      userId: '550e8400-e29b-41d4-a716-446655440123',
      type: TokenType.UserInvitation,
      token: mockTokenString,
      status: TokenStatus.Pending,
      expiresAt: nowPlus(hour()),
      createdAt: new Date(),
      usedAt: null,
      metadata: null,
    }

    mockUser = {
      id: '550e8400-e29b-41d4-a716-446655440123',
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
      role: Role.Admin,
      status: Status.Pending,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as User

    mockActivatedUser = {
      ...mockUser,
      status: Status.Active,
    } as User

    mockAccessToken = 'mock-access-token'
    mockRefreshToken = 'mock-refresh-token'

    mockTokenRepo = {
      findByToken: mock(async () => mockTokenRecord),
      update: mock(async () => {}),
    }
    mockAuthRepo = {
      update: mock(async () => {}),
    }
    mockUserRepo = {
      findById: mock(async () => mockActivatedUser),
      update: mock(async () => {}),
    }
    mockRefreshTokenRepo = {
      create: mock(async () => {}),
    }
    mockTransaction = {
      transaction: mock(async (callback: any) => callback({}) as Promise<void>),
    }

    await moduleMocker.mock('@/data', () => ({
      tokenRepo: mockTokenRepo,
      authRepo: mockAuthRepo,
      userRepo: mockUserRepo,
      refreshTokenRepo: mockRefreshTokenRepo,
      db: mockTransaction,
    }))

    mockTokenValidator = {
      validate: mock(() => mockTokenRecord),
    }
    mockGenerateHashedToken = mock(async () => ({
      token: { raw: mockRefreshToken, hashed: 'hashed-refresh' },
      expiresAt: nowPlus(hour()),
    }))

    await moduleMocker.mock('@/security/token', () => ({
      TokenValidator: mockTokenValidator,
      generateHashedToken: mockGenerateHashedToken,
    }))

    mockHashedPassword = 'mock-hashed-new-password'
    mockHashPassword = mock(async () => mockHashedPassword)

    await moduleMocker.mock('@/security/password', () => ({
      hashPassword: mockHashPassword,
    }))

    mockSignJwt = mock(async () => mockAccessToken)

    await moduleMocker.mock('@/security/jwt', () => ({
      signJwt: mockSignJwt,
    }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  describe('when token is valid and active', () => {
    it('should validate token, hash password, mark token as used, update password, activate user, and return user with tokens', async () => {
      const result = await acceptInvite({
        token: mockTokenString,
        password: mockPassword,
        deviceInfo: mockDeviceInfo,
      })

      expect(mockTokenRepo.findByToken).toHaveBeenCalledWith(mockTokenString)
      expect(mockTokenRepo.findByToken).toHaveBeenCalledTimes(1)

      expect(mockTransaction.transaction).toHaveBeenCalledTimes(1)

      expect(mockHashPassword).toHaveBeenCalledWith(mockPassword)
      expect(mockHashPassword).toHaveBeenCalledTimes(1)

      expect(mockTokenRepo.update).toHaveBeenCalledWith(mockTokenRecord.id, {
        status: TokenStatus.Used,
        usedAt: expect.any(Date),
      }, {})
      expect(mockTokenRepo.update).toHaveBeenCalledTimes(1)

      expect(mockAuthRepo.update).toHaveBeenCalledWith(mockTokenRecord.userId, {
        passwordHash: mockHashedPassword,
      }, {})
      expect(mockAuthRepo.update).toHaveBeenCalledTimes(1)

      expect(mockUserRepo.update).toHaveBeenCalledWith(mockTokenRecord.userId, {
        status: Status.Active,
      }, {})
      expect(mockUserRepo.update).toHaveBeenCalledTimes(1)

      expect(mockUserRepo.findById).toHaveBeenCalledWith(mockTokenRecord.userId)
      expect(mockSignJwt).toHaveBeenCalledTimes(1)
      expect(mockRefreshTokenRepo.create).toHaveBeenCalledTimes(1)

      expect(result).toEqual({
        data: { user: mockActivatedUser, accessToken: mockAccessToken },
        refreshToken: mockRefreshToken,
      })
    })
  })

  describe('when token validation fails', () => {
    it('should throw the validation error without updating anything', async () => {
      mockTokenValidator.validate.mockImplementation(() => {
        throw new AppError(ErrorCode.TokenNotFound)
      })

      try {
        await acceptInvite(
          { token: 'invalid-token', password: mockPassword, deviceInfo: mockDeviceInfo },
        )
        expect(true).toBe(false)
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).code).toBe(ErrorCode.TokenNotFound)
      }

      expect(mockTransaction.transaction).not.toHaveBeenCalled()
      expect(mockTokenRepo.update).not.toHaveBeenCalled()
      expect(mockAuthRepo.update).not.toHaveBeenCalled()
      expect(mockUserRepo.update).not.toHaveBeenCalled()
    })
  })

  describe('when token is expired', () => {
    it('should throw TokenExpired error', async () => {
      mockTokenValidator.validate.mockImplementation(() => {
        throw new AppError(ErrorCode.TokenExpired)
      })

      try {
        await acceptInvite(
          { token: mockTokenString, password: mockPassword, deviceInfo: mockDeviceInfo },
        )
        expect(true).toBe(false)
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).code).toBe(ErrorCode.TokenExpired)
      }

      expect(mockTransaction.transaction).not.toHaveBeenCalled()
      expect(mockTokenRepo.update).not.toHaveBeenCalled()
      expect(mockAuthRepo.update).not.toHaveBeenCalled()
      expect(mockUserRepo.update).not.toHaveBeenCalled()
    })
  })

  describe('when token is already used', () => {
    it('should throw TokenAlreadyUsed error', async () => {
      mockTokenValidator.validate.mockImplementation(() => {
        throw new AppError(ErrorCode.TokenAlreadyUsed)
      })

      try {
        await acceptInvite(
          { token: mockTokenString, password: mockPassword, deviceInfo: mockDeviceInfo },
        )
        expect(true).toBe(false)
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).code).toBe(ErrorCode.TokenAlreadyUsed)
      }

      expect(mockTransaction.transaction).not.toHaveBeenCalled()
      expect(mockTokenRepo.update).not.toHaveBeenCalled()
      expect(mockAuthRepo.update).not.toHaveBeenCalled()
      expect(mockUserRepo.update).not.toHaveBeenCalled()
    })
  })

  describe('when token type is wrong', () => {
    it('should throw TokenTypeMismatch error for password reset token', async () => {
      mockTokenValidator.validate.mockImplementation(() => {
        throw new AppError(ErrorCode.TokenTypeMismatch)
      })

      try {
        await acceptInvite(
          { token: mockTokenString, password: mockPassword, deviceInfo: mockDeviceInfo },
        )
        expect(true).toBe(false)
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).code).toBe(ErrorCode.TokenTypeMismatch)
      }

      expect(mockTransaction.transaction).not.toHaveBeenCalled()
      expect(mockTokenRepo.update).not.toHaveBeenCalled()
      expect(mockAuthRepo.update).not.toHaveBeenCalled()
      expect(mockUserRepo.update).not.toHaveBeenCalled()
    })
  })

  describe('when token marking as used fails', () => {
    it('should throw the error and not update password or user status', async () => {
      mockTokenRepo.update.mockImplementation(async () => {
        throw new Error('Database connection failed')
      })

      try {
        await acceptInvite(
          { token: mockTokenString, password: mockPassword, deviceInfo: mockDeviceInfo },
        )
        expect(true).toBe(false)
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Database connection failed')
      }

      expect(mockTransaction.transaction).toHaveBeenCalledTimes(1)
      expect(mockTokenRepo.update).toHaveBeenCalledTimes(1)
      expect(mockAuthRepo.update).not.toHaveBeenCalled()
      expect(mockUserRepo.update).not.toHaveBeenCalled()
    })
  })

  describe('when password update fails', () => {
    it('should throw the error within transaction', async () => {
      mockAuthRepo.update.mockImplementation(async () => {
        throw new Error('Password update failed')
      })

      try {
        await acceptInvite(
          { token: mockTokenString, password: mockPassword, deviceInfo: mockDeviceInfo },
        )
        expect(true).toBe(false)
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Password update failed')
      }

      expect(mockTransaction.transaction).toHaveBeenCalledTimes(1)
      expect(mockTokenRepo.update).toHaveBeenCalledTimes(1)
      expect(mockAuthRepo.update).toHaveBeenCalledTimes(1)
      expect(mockUserRepo.update).not.toHaveBeenCalled()
    })
  })

  describe('when user status update fails', () => {
    it('should throw the error within transaction', async () => {
      mockUserRepo.update.mockImplementation(async () => {
        throw new Error('User status update failed')
      })

      try {
        await acceptInvite(
          { token: mockTokenString, password: mockPassword, deviceInfo: mockDeviceInfo },
        )
        expect(true).toBe(false)
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('User status update failed')
      }

      expect(mockTransaction.transaction).toHaveBeenCalledTimes(1)
      expect(mockTokenRepo.update).toHaveBeenCalledTimes(1)
      expect(mockAuthRepo.update).toHaveBeenCalledTimes(1)
      expect(mockUserRepo.update).toHaveBeenCalledTimes(1)
    })
  })

  describe('when password hashing fails', () => {
    it('should throw the error within transaction', async () => {
      mockHashPassword.mockImplementation(async () => {
        throw new Error('Password hashing failed')
      })

      try {
        await acceptInvite(
          { token: mockTokenString, password: mockPassword, deviceInfo: mockDeviceInfo },
        )
        expect(true).toBe(false)
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Password hashing failed')
      }

      expect(mockTransaction.transaction).toHaveBeenCalledTimes(1)
      expect(mockTokenRepo.update).toHaveBeenCalledTimes(1)
      expect(mockAuthRepo.update).not.toHaveBeenCalled()
      expect(mockUserRepo.update).not.toHaveBeenCalled()
    })
  })

  describe('edge cases', () => {
    it('should handle empty password', async () => {
      try {
        await acceptInvite({ token: mockTokenString, password: '', deviceInfo: mockDeviceInfo })
        expect(true).toBe(false)
      } catch (error) {
        expect(error).toBeDefined()
      }
    })

    it('should handle very long passwords', async () => {
      const longPassword = `A1@${'a'.repeat(1000)}`

      const result = await acceptInvite({
        token: mockTokenString,
        password: longPassword,
        deviceInfo: mockDeviceInfo,
      })

      expect(result).toEqual({
        data: { user: mockActivatedUser, accessToken: mockAccessToken },
        refreshToken: mockRefreshToken,
      })

      expect(mockHashPassword).toHaveBeenCalledWith(longPassword)
      expect(mockHashPassword).toHaveBeenCalledTimes(1)
    })
  })
})
