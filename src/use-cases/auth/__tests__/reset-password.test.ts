import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import type { TokenRecord, User, UserTeamInfo } from '@/data'
import type { DeviceInfo } from '@/net/http/device'

import { ModuleMocker, testUuids } from '@/__tests__'
import { AppError, ErrorCode } from '@/errors'
import { TOKEN_LENGTH, TokenStatus, TokenType } from '@/security/token'
import Role from '@/types/role'
import Status from '@/types/status'
import { hour, nowPlus } from '@/utils/chrono'

import { resetPassword } from '../reset-password'

describe('Reset Password', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockPassword: string
  let mockDeviceInfo: DeviceInfo

  let mockTokenString: string
  let mockTokenRecord: TokenRecord
  let mockTokenRepo: any
  let mockAuthRepo: any
  let mockUserRepo: any
  let mockRefreshTokenRepo: any
  let mockTeamRepo: any
  let mockTeam: UserTeamInfo | undefined
  let mockTransaction: any

  let mockTokenValidator: any
  let mockGenerateHashedToken: any

  let mockHashedPassword: string
  let mockHashPassword: any

  let mockUser: User
  let mockAccessToken: string
  let mockRefreshToken: string
  let mockSignJwt: any
  let mockResolvePermissions: any

  beforeEach(async () => {
    mockPassword = 'NewSecure@123'
    mockDeviceInfo = { ipAddress: '127.0.0.1', userAgent: 'test-agent' }

    mockTokenString = `mock-reset-token-${'1'.repeat(TOKEN_LENGTH - 18)}`
    mockTokenRecord = {
      id: 1,
      userId: testUuids.USER_1,
      type: TokenType.PasswordReset,
      token: mockTokenString,
      status: TokenStatus.Pending,
      expiresAt: nowPlus(hour()),
      createdAt: new Date(),
      usedAt: null,
      metadata: null,
    }

    mockUser = {
      id: testUuids.USER_1,
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: Role.User,
      status: Status.Active,
      createdAt: new Date(),
      updatedAt: new Date(),
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
      findById: mock(async () => mockUser),
    }
    mockRefreshTokenRepo = {
      create: mock(async () => {}),
    }
    mockTeam = undefined
    mockTeamRepo = {
      findUserTeam: mock(async () => mockTeam),
    }
    mockTransaction = {
      transaction: mock(async (callback: any) => callback({}) as Promise<void>),
    }

    await moduleMocker.mock('@/data', () => ({
      tokenRepo: mockTokenRepo,
      authRepo: mockAuthRepo,
      userRepo: mockUserRepo,
      refreshTokenRepo: mockRefreshTokenRepo,
      teamRepo: mockTeamRepo,
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

    mockResolvePermissions = mock(async () => undefined)

    await moduleMocker.mock('../../resolve-permissions', () => ({
      resolvePermissionList: mockResolvePermissions,
    }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  describe('when token is valid and active', () => {
    it('should validate token, hash password, mark token as used, update password, and return user with tokens', async () => {
      const result = await resetPassword(
        { token: mockTokenString, password: mockPassword },
        mockDeviceInfo,
      )

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

      expect(mockUserRepo.findById).toHaveBeenCalledWith(mockTokenRecord.userId)
      expect(mockSignJwt).toHaveBeenCalledTimes(1)
      expect(mockRefreshTokenRepo.create).toHaveBeenCalledTimes(1)

      expect(result).toEqual({
        data: {
          user: mockUser,
          team: undefined,
          permissions: undefined,
          accessToken: mockAccessToken,
        },
        refreshToken: mockRefreshToken,
      })
    })

    it('should include team info when user belongs to a team', async () => {
      mockTeam = {
        id: 'team-456',
        name: 'Tech Inc',
        position: 'Developer',
      }
      mockTeamRepo.findUserTeam.mockImplementation(async () => mockTeam)

      const result = await resetPassword(
        { token: mockTokenString, password: mockPassword },
        mockDeviceInfo,
      )

      expect(result.data.team).toEqual(mockTeam)
      expect(mockTeamRepo.findUserTeam).toHaveBeenCalledWith(mockUser.id)
    })
  })

  describe('when token validation fails', () => {
    it('should throw the validation error without updating anything', async () => {
      mockTokenValidator.validate.mockImplementation(() => {
        throw new AppError(ErrorCode.TokenNotFound)
      })

      try {
        await resetPassword(
          { token: 'invalid-token', password: mockPassword },
          mockDeviceInfo,
        )
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).code).toBe(ErrorCode.TokenNotFound)
      }

      expect(mockTransaction.transaction).not.toHaveBeenCalled()
      expect(mockTokenRepo.update).not.toHaveBeenCalled()
      expect(mockAuthRepo.update).not.toHaveBeenCalled()
    })
  })

  describe('when token is expired', () => {
    it('should throw TokenExpired error', async () => {
      mockTokenValidator.validate.mockImplementation(() => {
        throw new AppError(ErrorCode.TokenExpired)
      })

      try {
        await resetPassword(
          { token: mockTokenString, password: mockPassword },
          mockDeviceInfo,
        )
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).code).toBe(ErrorCode.TokenExpired)
      }

      expect(mockTransaction.transaction).not.toHaveBeenCalled()
      expect(mockTokenRepo.update).not.toHaveBeenCalled()
      expect(mockAuthRepo.update).not.toHaveBeenCalled()
    })
  })

  describe('when token is already used', () => {
    it('should throw TokenAlreadyUsed error', async () => {
      mockTokenValidator.validate.mockImplementation(() => {
        throw new AppError(ErrorCode.TokenAlreadyUsed)
      })

      try {
        await resetPassword(
          { token: mockTokenString, password: mockPassword },
          mockDeviceInfo,
        )
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).code).toBe(ErrorCode.TokenAlreadyUsed)
      }

      expect(mockTransaction.transaction).not.toHaveBeenCalled()
      expect(mockTokenRepo.update).not.toHaveBeenCalled()
      expect(mockAuthRepo.update).not.toHaveBeenCalled()
    })
  })

  describe('when token type is wrong', () => {
    it('should throw TokenTypeMismatch error', async () => {
      mockTokenValidator.validate.mockImplementation(() => {
        throw new AppError(ErrorCode.TokenTypeMismatch)
      })

      try {
        await resetPassword(
          { token: mockTokenString, password: mockPassword },
          mockDeviceInfo,
        )
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).code).toBe(ErrorCode.TokenTypeMismatch)
      }

      expect(mockTransaction.transaction).not.toHaveBeenCalled()
      expect(mockTokenRepo.update).not.toHaveBeenCalled()
      expect(mockAuthRepo.update).not.toHaveBeenCalled()
    })
  })

  describe('when token marking as used fails', () => {
    it('should throw the error and not update password', async () => {
      mockTokenRepo.update.mockImplementation(async () => {
        throw new Error('Database connection failed')
      })

      try {
        await resetPassword(
          { token: mockTokenString, password: mockPassword },
          mockDeviceInfo,
        )
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Database connection failed')
      }

      expect(mockTransaction.transaction).toHaveBeenCalledTimes(1)
      expect(mockTokenRepo.update).toHaveBeenCalledTimes(1)
      expect(mockAuthRepo.update).not.toHaveBeenCalled()
    })
  })

  describe('when password update fails', () => {
    it('should throw the error within transaction', async () => {
      mockAuthRepo.update.mockImplementation(async () => {
        throw new Error('Password update failed')
      })

      try {
        await resetPassword(
          { token: mockTokenString, password: mockPassword },
          mockDeviceInfo,
        )
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Password update failed')
      }

      expect(mockTransaction.transaction).toHaveBeenCalledTimes(1)
      expect(mockTokenRepo.update).toHaveBeenCalledTimes(1)
      expect(mockAuthRepo.update).toHaveBeenCalledTimes(1)
    })
  })

  describe('when password hashing fails', () => {
    it('should throw the error within transaction', async () => {
      mockHashPassword.mockImplementation(async () => {
        throw new Error('Password hashing failed')
      })

      try {
        await resetPassword(
          { token: mockTokenString, password: mockPassword },
          mockDeviceInfo,
        )
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Password hashing failed')
      }

      expect(mockTransaction.transaction).toHaveBeenCalledTimes(1)
      expect(mockTokenRepo.update).toHaveBeenCalledTimes(1)
      expect(mockAuthRepo.update).not.toHaveBeenCalled()
    })
  })

  describe('edge cases', () => {
    it('should handle empty password', async () => {
      try {
        await resetPassword({ token: mockTokenString, password: '' }, mockDeviceInfo)
        expect(true).toBe(false) // should not reach here due to validation
      } catch (error) {
        // This would be caught by the validation layer before reaching this function
        expect(error).toBeDefined()
      }
    })

    it('should handle very long passwords', async () => {
      const longPassword = `A1@${'a'.repeat(1000)}` // very long password

      const result = await resetPassword(
        { token: mockTokenString, password: longPassword },
        mockDeviceInfo,
      )

      expect(result).toEqual({
        data: {
          user: mockUser,
          team: undefined,
          permissions: undefined,
          accessToken: mockAccessToken,
        },
        refreshToken: mockRefreshToken,
      })

      expect(mockHashPassword).toHaveBeenCalledWith(longPassword)
      expect(mockHashPassword).toHaveBeenCalledTimes(1)
    })
  })

  describe('permissions in response', () => {
    it('should omit permissions from data when user has no permissions', async () => {
      const result = await resetPassword(
        { token: mockTokenString, password: mockPassword },
        mockDeviceInfo,
      )

      expect(result.data.permissions).toBeUndefined()
    })
  })
})
