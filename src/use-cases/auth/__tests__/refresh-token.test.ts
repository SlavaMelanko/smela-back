import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import type { RefreshToken, User } from '@/data'

import { ModuleMocker, testUuids } from '@/__tests__'
import { ErrorCode } from '@/errors'
import { Role, Status } from '@/types'

import refreshAuthTokens from '../refresh-token'

describe('Refresh Auth Tokens', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockRefreshToken: string
  let mockDeviceInfo: { ipAddress: string, userAgent: string }

  let mockUser: User
  let mockUserRepo: any
  let mockStoredToken: RefreshToken
  let mockRefreshTokenRepo: any
  let mockDb: any

  let mockHashToken: any

  let mockJwtToken: string
  let mockSignJwt: any

  let mockLogger: any

  beforeEach(async () => {
    mockRefreshToken = 'valid_refresh_token_123'
    mockDeviceInfo = {
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0 (Test)',
    }

    mockUser = {
      id: testUuids.USER_1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'test@example.com',
      status: Status.Verified,
      role: Role.User,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    }
    mockUserRepo = {
      findById: mock(async () => mockUser),
    }
    mockStoredToken = {
      id: 1,
      userId: testUuids.USER_1,
      tokenHash: 'hashed_token_123',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0 (Test)',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      revokedAt: null,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    }
    mockRefreshTokenRepo = {
      findByHash: mock(async () => mockStoredToken),
      create: mock(async () => 1),
      revokeByHash: mock(async () => true),
    }
    mockDb = {
      transaction: mock(async <T>(callback: (tx: any) => Promise<T>): Promise<T> => {
        const mockTx = Symbol('transaction')

        return callback(mockTx)
      }),
    }

    await moduleMocker.mock('@/data', () => ({
      db: mockDb,
      userRepo: mockUserRepo,
      refreshTokenRepo: mockRefreshTokenRepo,
    }))

    mockHashToken = mock(async () => 'hashed_token_123')

    await moduleMocker.mock('@/security/token', () => ({
      hashToken: mockHashToken,
      generateHashedToken: mock(async () => ({
        token: { raw: 'new_refresh_token_456', hashed: 'new_hashed_token_456' },
        expiresAt: new Date('2025-03-01'),
        type: 'refresh_token',
      })),
      TokenType: { RefreshToken: 'refresh_token' },
    }))

    mockJwtToken = 'new_jwt_token_789'
    mockSignJwt = mock(async () => mockJwtToken)

    await moduleMocker.mock('@/security/jwt', () => ({
      signJwt: mockSignJwt,
    }))

    mockLogger = {
      warn: mock(() => {}),
    }

    await moduleMocker.mock('@/logging', () => ({
      logger: mockLogger,
    }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  describe('successful token refresh', () => {
    it('should return new access token and refresh token for valid refresh token', async () => {
      const result = await refreshAuthTokens(mockRefreshToken, mockDeviceInfo)

      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('refreshToken')
      expect(result.data.accessToken).toBe(mockJwtToken)
      expect(result.refreshToken).toBe('new_refresh_token_456')
      expect(result.data.user).toEqual(mockUser)
    })

    it('should revoke old refresh token after successful refresh', async () => {
      await refreshAuthTokens(mockRefreshToken, mockDeviceInfo)

      expect(mockRefreshTokenRepo.revokeByHash).toHaveBeenCalledTimes(1)
      expect(mockRefreshTokenRepo.revokeByHash).toHaveBeenCalledWith(
        'hashed_token_123',
        expect.any(Symbol),
      )
    })

    it('should create new refresh token with device info', async () => {
      await refreshAuthTokens(mockRefreshToken, mockDeviceInfo)

      expect(mockRefreshTokenRepo.create).toHaveBeenCalledTimes(1)
      expect(mockRefreshTokenRepo.create).toHaveBeenCalledWith(
        {
          userId: mockUser.id,
          tokenHash: 'new_hashed_token_456',
          ipAddress: mockDeviceInfo.ipAddress,
          userAgent: mockDeviceInfo.userAgent,
          expiresAt: new Date('2025-03-01'),
        },
        expect.any(Symbol),
      )
    })

    it('should use transaction for token rotation', async () => {
      await refreshAuthTokens(mockRefreshToken, mockDeviceInfo)

      expect(mockDb.transaction).toHaveBeenCalledTimes(1)
      expect(mockDb.transaction).toHaveBeenCalledWith(expect.any(Function))
    })

    it('should create new tokens before revoking old token (correct order)', async () => {
      const callOrder: string[] = []

      mockRefreshTokenRepo.create.mockImplementation(async () => {
        callOrder.push('create')

        return 1
      })

      mockRefreshTokenRepo.revokeByHash.mockImplementation(async () => {
        callOrder.push('revoke')

        return true
      })

      await refreshAuthTokens(mockRefreshToken, mockDeviceInfo)

      expect(callOrder).toEqual(['create', 'revoke'])
    })
  })

  describe('missing refresh token scenarios', () => {
    it('should throw MissingRefreshToken when token is empty string', async () => {
      expect(
        refreshAuthTokens('', mockDeviceInfo),
      ).rejects.toMatchObject({
        name: 'AppError',
        code: ErrorCode.MissingRefreshToken,
      })
    })

    it('should throw MissingRefreshToken when token is null', async () => {
      expect(
        refreshAuthTokens(null as any, mockDeviceInfo),
      ).rejects.toMatchObject({
        name: 'AppError',
        code: ErrorCode.MissingRefreshToken,
      })
    })

    it('should throw MissingRefreshToken when token is undefined', async () => {
      expect(
        refreshAuthTokens(undefined as any, mockDeviceInfo),
      ).rejects.toMatchObject({
        name: 'AppError',
        code: ErrorCode.MissingRefreshToken,
      })
    })
  })

  describe('invalid refresh token scenarios', () => {
    it('should throw InvalidRefreshToken when token not found in database', async () => {
      mockRefreshTokenRepo.findByHash.mockImplementation(async () => null)

      expect(refreshAuthTokens(mockRefreshToken, mockDeviceInfo)).rejects.toMatchObject({
        name: 'AppError',
        code: ErrorCode.InvalidRefreshToken,
      })
    })

    it('should hash refresh token before lookup', async () => {
      await refreshAuthTokens(mockRefreshToken, mockDeviceInfo)

      expect(mockHashToken).toHaveBeenCalledTimes(1)
      expect(mockHashToken).toHaveBeenCalledWith('valid_refresh_token_123')
    })
  })

  describe('revoked refresh token scenarios', () => {
    it('should throw RefreshTokenRevoked when token has revokedAt timestamp', async () => {
      mockRefreshTokenRepo.findByHash.mockImplementation(async () => ({
        ...mockStoredToken,
        revokedAt: new Date('2024-01-15'),
      }))

      expect(refreshAuthTokens(mockRefreshToken, mockDeviceInfo)).rejects.toMatchObject({
        name: 'AppError',
        code: ErrorCode.RefreshTokenRevoked,
      })
    })

    it('should check revoked status before expiration check', async () => {
      const pastDate = new Date('2023-01-01')
      mockRefreshTokenRepo.findByHash.mockImplementation(async () => ({
        ...mockStoredToken,
        revokedAt: new Date('2024-01-15'),
        expiresAt: pastDate,
      }))

      expect(refreshAuthTokens(mockRefreshToken, mockDeviceInfo)).rejects.toMatchObject({
        name: 'AppError',
        code: ErrorCode.RefreshTokenRevoked,
      })
    })
  })

  describe('expired refresh token scenarios', () => {
    it('should throw RefreshTokenExpired when token has expired', async () => {
      const pastDate = new Date('2023-01-01')
      mockRefreshTokenRepo.findByHash.mockImplementation(async () => ({
        ...mockStoredToken,
        expiresAt: pastDate,
      }))

      expect(refreshAuthTokens(mockRefreshToken, mockDeviceInfo)).rejects.toMatchObject({
        name: 'AppError',
        code: ErrorCode.RefreshTokenExpired,
      })
    })

    it('should consider token expired at exact expiration time', async () => {
      const now = new Date()
      mockRefreshTokenRepo.findByHash.mockImplementation(async () => ({
        ...mockStoredToken,
        expiresAt: new Date(now.getTime() - 1),
      }))

      expect(refreshAuthTokens(mockRefreshToken, mockDeviceInfo)).rejects.toMatchObject({
        name: 'AppError',
        code: ErrorCode.RefreshTokenExpired,
      })
    })
  })

  describe('user validation scenarios', () => {
    it('should throw InvalidRefreshToken when user does not exist', async () => {
      mockUserRepo.findById.mockImplementation(async () => null)

      expect(refreshAuthTokens(mockRefreshToken, mockDeviceInfo)).rejects.toMatchObject({
        name: 'AppError',
        code: ErrorCode.InvalidRefreshToken,
      })
    })

    it('should handle suspended user status', async () => {
      const suspendedUser = { ...mockUser, status: Status.Suspended }
      mockUserRepo.findById.mockImplementation(async () => suspendedUser)

      const result = await refreshAuthTokens(mockRefreshToken, mockDeviceInfo)
      expect(result.data.user.status).toBe(Status.Suspended)
    })

    it('should handle new user status', async () => {
      const newUser = { ...mockUser, status: Status.New }
      mockUserRepo.findById.mockImplementation(async () => newUser)

      const result = await refreshAuthTokens(mockRefreshToken, mockDeviceInfo)
      expect(result.data.user.status).toBe(Status.New)
    })
  })

  describe('device change detection', () => {
    it('should log warning when IP address changes', async () => {
      const changedDeviceInfo = { ...mockDeviceInfo, ipAddress: '10.0.0.1' }

      await refreshAuthTokens(mockRefreshToken, changedDeviceInfo)

      expect(mockLogger.warn).toHaveBeenCalledTimes(1)
      expect(mockLogger.warn).toHaveBeenCalledWith(
        {
          userId: mockUser.id,
          oldIp: '192.168.1.1',
          newIp: '10.0.0.1',
          oldUserAgent: 'Mozilla/5.0 (Test)',
          newUserAgent: 'Mozilla/5.0 (Test)',
        },
        'Device change detected during token refresh',
      )
    })

    it('should log warning when User-Agent changes', async () => {
      const changedDeviceInfo = { ...mockDeviceInfo, userAgent: 'Chrome/91.0' }

      await refreshAuthTokens(mockRefreshToken, changedDeviceInfo)

      expect(mockLogger.warn).toHaveBeenCalledTimes(1)
    })

    it('should log warning when both IP and User-Agent change', async () => {
      const changedDeviceInfo = { ipAddress: '10.0.0.1', userAgent: 'Chrome/91.0' }

      await refreshAuthTokens(mockRefreshToken, changedDeviceInfo)

      expect(mockLogger.warn).toHaveBeenCalledTimes(1)
    })

    it('should not log warning when device info matches', async () => {
      await refreshAuthTokens(mockRefreshToken, mockDeviceInfo)

      expect(mockLogger.warn).not.toHaveBeenCalled()
    })

    it('should not block request when device changes', async () => {
      const changedDeviceInfo = { ipAddress: '10.0.0.1', userAgent: 'Chrome/91.0' }

      const result = await refreshAuthTokens(mockRefreshToken, changedDeviceInfo)

      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('refreshToken')
      expect(result.data.accessToken).toBe(mockJwtToken)
    })

    it('should handle null device info gracefully', async () => {
      mockRefreshTokenRepo.findByHash.mockImplementation(async () => ({
        ...mockStoredToken,
        ipAddress: null,
        userAgent: null,
      }))

      const changedDeviceInfo = { ipAddress: '10.0.0.1', userAgent: 'Chrome/91.0' }

      await refreshAuthTokens(mockRefreshToken, changedDeviceInfo)

      expect(mockLogger.warn).toHaveBeenCalledTimes(1)
    })
  })

  describe('JWT generation scenarios', () => {
    it('should generate JWT with correct user claims', async () => {
      await refreshAuthTokens(mockRefreshToken, mockDeviceInfo)

      expect(mockSignJwt).toHaveBeenCalledTimes(1)
      expect(mockSignJwt).toHaveBeenCalledWith({
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        status: mockUser.status,
      })
    })

    it('should handle JWT signing failure', async () => {
      mockSignJwt.mockImplementation(async () => {
        throw new Error('JWT signing failed')
      })

      expect(refreshAuthTokens(mockRefreshToken, mockDeviceInfo)).rejects.toThrow('JWT signing failed')
    })

    it('should handle different user roles in JWT', async () => {
      const roles = [Role.User, Role.Admin, Role.Owner]

      for (const role of roles) {
        const userWithRole = { ...mockUser, role }
        mockUserRepo.findById.mockImplementation(async () => userWithRole)

        await refreshAuthTokens(mockRefreshToken, mockDeviceInfo)

        const lastCall = mockSignJwt.mock.calls[mockSignJwt.mock.calls.length - 1]
        expect(lastCall[0].role).toBe(role)
      }
    })
  })

  describe('repository error scenarios', () => {
    it('should handle token lookup database failure', async () => {
      mockRefreshTokenRepo.findByHash.mockImplementation(async () => {
        throw new Error('Database connection failed')
      })

      try {
        await refreshAuthTokens(mockRefreshToken, mockDeviceInfo)
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Database connection failed')
      }
    })

    it('should handle user lookup database failure', async () => {
      mockUserRepo.findById.mockImplementation(async () => {
        throw new Error('User table query failed')
      })

      try {
        await refreshAuthTokens(mockRefreshToken, mockDeviceInfo)
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('User table query failed')
      }
    })

    it('should handle token creation failure during rotation', async () => {
      mockRefreshTokenRepo.create.mockImplementation(async () => {
        throw new Error('Token creation failed')
      })

      try {
        await refreshAuthTokens(mockRefreshToken, mockDeviceInfo)
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Token creation failed')
      }
    })

    it('should not revoke old token if new token creation fails (transaction rollback)', async () => {
      mockRefreshTokenRepo.create.mockImplementation(async () => {
        throw new Error('Token creation failed')
      })

      try {
        await refreshAuthTokens(mockRefreshToken, mockDeviceInfo)
        expect(true).toBe(false) // should not reach here
      } catch {
        // Transaction should rollback, so revokeByHash should not be called
        expect(mockRefreshTokenRepo.revokeByHash).not.toHaveBeenCalled()
      }
    })

    it('should rollback transaction if revocation fails', async () => {
      mockRefreshTokenRepo.revokeByHash.mockImplementation(async () => {
        throw new Error('Revocation failed')
      })

      try {
        await refreshAuthTokens(mockRefreshToken, mockDeviceInfo)
        expect(true).toBe(false) // should not reach here
      } catch {
        // Verify transaction was attempted
        expect(mockDb.transaction).toHaveBeenCalledTimes(1)
      }
    })
  })

  describe('edge cases', () => {
    it('should handle very long refresh tokens', async () => {
      const longToken = 'a'.repeat(1000)
      await refreshAuthTokens(longToken, mockDeviceInfo)

      expect(mockHashToken).toHaveBeenCalledWith(longToken)
    })

    it('should handle refresh token with special characters', async () => {
      const specialToken = 'token!@#$%^&*()_+-=[]{}|;:,.<>?'
      await refreshAuthTokens(specialToken, mockDeviceInfo)

      expect(mockHashToken).toHaveBeenCalledWith(specialToken)
    })

    it('should handle null IP address in device info', async () => {
      const deviceInfoWithNullIp = { ipAddress: null, userAgent: 'Mozilla/5.0 (Test)' }

      const result = await refreshAuthTokens(mockRefreshToken, deviceInfoWithNullIp)

      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('refreshToken')
    })

    it('should handle null User-Agent in device info', async () => {
      const deviceInfoWithNullUserAgent = { ipAddress: '192.168.1.1', userAgent: null }

      const result = await refreshAuthTokens(mockRefreshToken, deviceInfoWithNullUserAgent)

      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('refreshToken')
    })

    it('should handle both null IP and User-Agent', async () => {
      const deviceInfoWithNulls = { ipAddress: null, userAgent: null }

      const result = await refreshAuthTokens(mockRefreshToken, deviceInfoWithNulls)

      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('refreshToken')
    })
  })

  describe('data consistency', () => {
    it('should not expose sensitive user fields', async () => {
      const result = await refreshAuthTokens(mockRefreshToken, mockDeviceInfo)

      expect(result.data.user).toHaveProperty('id')
      expect(result.data.user).toHaveProperty('email')
      expect(result.data.user).toHaveProperty('firstName')
      expect(result.data.user).toHaveProperty('lastName')
      expect(result.data.user).toHaveProperty('role')
      expect(result.data.user).toHaveProperty('status')
      expect(result.data.user).not.toHaveProperty('tokenVersion')
    })

    it('should return different refresh token than input', async () => {
      const result = await refreshAuthTokens(mockRefreshToken, mockDeviceInfo)

      expect(result.refreshToken).not.toBe(mockRefreshToken)
      expect(result.refreshToken).toBe('new_refresh_token_456')
    })
  })
})
