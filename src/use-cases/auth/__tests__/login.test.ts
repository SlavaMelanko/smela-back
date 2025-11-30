import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import type { AuthRecord, User } from '@/data'

import { ModuleMocker } from '@/__tests__'
import { AppError, ErrorCode } from '@/errors'
import { Role, Status } from '@/types'

import type { LoginParams } from '../login'

import logInWithEmail from '../login'

describe('Login with Email', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockLoginParams: LoginParams
  let mockDeviceInfo: { ipAddress: string, userAgent: string }

  let mockUser: User
  let mockUserRepo: any
  let mockAuthRecord: AuthRecord
  let mockAuthRepo: any
  let mockRefreshTokenRepo: any

  let mockComparePasswords: any

  let mockJwtToken: string
  let mockCreateJwt: any

  let mockGenerateHashedToken: any

  beforeEach(async () => {
    mockLoginParams = {
      email: 'test@example.com',
      password: 'ValidPass123!',
    }
    mockDeviceInfo = {
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0 (Test)',
    }

    mockUser = {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'test@example.com',
      status: Status.Verified,
      role: Role.User,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    }
    mockUserRepo = {
      findByEmail: mock(async () => mockUser),
    }
    mockAuthRecord = {
      id: 1,
      userId: 1,
      provider: 'local',
      identifier: 'test@example.com',
      passwordHash: '$2b$10$hashedPassword123',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    }
    mockAuthRepo = {
      findById: mock(async () => mockAuthRecord),
    }
    mockRefreshTokenRepo = {
      create: mock(async () => 1),
    }

    await moduleMocker.mock('@/data', () => ({
      userRepo: mockUserRepo,
      authRepo: mockAuthRepo,
      refreshTokenRepo: mockRefreshTokenRepo,
    }))

    mockComparePasswords = mock(async () => true)

    await moduleMocker.mock('@/security/password', () => ({
      comparePasswords: mockComparePasswords,
    }))

    mockJwtToken = 'login-jwt-token-123'
    mockCreateJwt = mock(async () => mockJwtToken)

    await moduleMocker.mock('@/security/jwt', () => ({
      signJwt: mockCreateJwt,
    }))

    mockGenerateHashedToken = mock(async () => ({
      token: { raw: 'refresh_token_123', hashed: 'hashed_refresh_token_123' },
      expiresAt: new Date('2024-02-01'),
      type: 'refresh_token',
    }))

    await moduleMocker.mock('@/security/token', () => ({
      generateHashedToken: mockGenerateHashedToken,
      TokenType: { RefreshToken: 'refresh_token' },
    }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  describe('successful login', () => {
    it('should return user and token for valid credentials', async () => {
      const result = await logInWithEmail(mockLoginParams, mockDeviceInfo)

      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('refreshToken')
      expect(result.data.accessToken).toBe(mockJwtToken)
      expect(result.refreshToken).toBe('refresh_token_123')
      expect(result.data.user).not.toHaveProperty('tokenVersion')
      expect(result.data.user.email).toBe(mockLoginParams.email)
    })

    it('should handle different user roles correctly', async () => {
      const adminUser = { ...mockUser, role: Role.Admin }

      mockUserRepo.findByEmail.mockImplementation(async () => adminUser)

      const result = await logInWithEmail(mockLoginParams, mockDeviceInfo)
      expect(result.data.user.role).toBe(Role.Admin)
    })
  })

  describe('user not found scenarios', () => {
    it('should throw InvalidCredentials when user does not exist', async () => {
      mockUserRepo.findByEmail.mockImplementation(async () => null)

      expect(logInWithEmail(mockLoginParams, mockDeviceInfo)).rejects.toMatchObject({
        name: 'AppError',
        code: ErrorCode.InvalidCredentials,
      })
    })

    it('should handle case-sensitive email lookup', async () => {
      const upperCaseEmail = mockLoginParams.email.toUpperCase()

      // Should still work with different case
      const result = await logInWithEmail(
        { ...mockLoginParams, email: upperCaseEmail },
        mockDeviceInfo,
      )
      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('refreshToken')
    })
  })

  describe('auth record scenarios', () => {
    it('should throw InvalidCredentials when auth record not found', async () => {
      mockAuthRepo.findById.mockImplementation(async () => null)

      expect(logInWithEmail(mockLoginParams, mockDeviceInfo)).rejects.toMatchObject({
        name: 'AppError',
        code: ErrorCode.InvalidCredentials,
      })
    })

    it('should throw InvalidCredentials when auth record has no password hash', async () => {
      mockAuthRepo.findById.mockImplementation(
        async () => ({ ...mockAuthRecord, passwordHash: null }),
      )

      expect(logInWithEmail(mockLoginParams, mockDeviceInfo)).rejects.toMatchObject({
        name: 'AppError',
        code: ErrorCode.InvalidCredentials,
      })
    })
  })

  describe('password validation scenarios', () => {
    it('should throw InvalidCredentials for incorrect password', async () => {
      mockComparePasswords.mockImplementation(async () => false)

      expect(logInWithEmail(mockLoginParams, mockDeviceInfo)).rejects.toMatchObject({
        name: 'AppError',
        code: ErrorCode.InvalidCredentials,
      })
    })

    it('should handle empty password input', async () => {
      mockComparePasswords.mockImplementation(async () => false)

      expect(logInWithEmail({ ...mockLoginParams, password: '' }, mockDeviceInfo)).rejects.toMatchObject({
        name: 'AppError',
        code: ErrorCode.InvalidCredentials,
      })
    })

    it('should handle password comparison failure', async () => {
      mockComparePasswords.mockImplementation(async () => {
        throw new Error('Password comparison failed')
      })

      expect(logInWithEmail(mockLoginParams, mockDeviceInfo)).rejects.toThrow(
        'Password comparison failed',
      )
    })
  })

  describe('JWT generation scenarios', () => {
    it('should handle JWT signing failure', async () => {
      mockCreateJwt.mockImplementation(async () => {
        throw new Error('JWT signing failed')
      })

      expect(logInWithEmail(mockLoginParams, mockDeviceInfo)).rejects.toThrow('JWT signing failed')
    })
  })

  describe('edge cases and boundary conditions', () => {
    const testCases = [
      {
        name: 'very long email addresses',
        params: { email: `${'a'.repeat(100)}@example.com` },
      },
      {
        name: 'very long passwords',
        params: { password: 'a'.repeat(1000) },
      },
      {
        name: 'special characters in email',
        params: { email: 'test+tag@example-domain.co.uk' },
      },
      {
        name: 'special characters in password',
        params: { password: '!@#$%^&*()_+-=[]{}|;:,.<>?' },
      },
      {
        name: 'Unicode characters in password',
        params: { password: '密码123é🔑' },
      },
    ]

    testCases.forEach(({ name, params }) => {
      it(`should handle ${name}`, async () => {
        const result = await logInWithEmail({ ...mockLoginParams, ...params }, mockDeviceInfo)
        expect(result).toHaveProperty('data')
        expect(result).toHaveProperty('refreshToken')
      })
    })
  })

  describe('repository error scenarios', () => {
    it('should handle user repository database failure', async () => {
      mockUserRepo.findByEmail.mockImplementation(async () => {
        throw new Error('Database connection failed')
      })

      try {
        await logInWithEmail(mockLoginParams, mockDeviceInfo)
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Database connection failed')
      }
    })

    it('should handle auth repository database failure', async () => {
      mockAuthRepo.findById.mockImplementation(async () => {
        throw new Error('Auth table query failed')
      })

      try {
        await logInWithEmail(mockLoginParams, mockDeviceInfo)
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Auth table query failed')
      }
    })

    it('should handle malformed auth data from database', async () => {
      mockAuthRepo.findById.mockImplementation(
        async () => ({ ...mockAuthRecord, passwordHash: undefined }),
      )

      try {
        await logInWithEmail(mockLoginParams, mockDeviceInfo)
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).code).toBe(ErrorCode.InvalidCredentials)
      }
    })
  })

  describe('data consistency and normalization', () => {
    it('should ensure user normalization removes sensitive fields', async () => {
      const result = await logInWithEmail(mockLoginParams, mockDeviceInfo)

      expect(result.data.user).not.toHaveProperty('tokenVersion')
      expect(result.data.user).toHaveProperty('id')
      expect(result.data.user).toHaveProperty('email')
      expect(result.data.user).toHaveProperty('firstName')
      expect(result.data.user).toHaveProperty('lastName')
      expect(result.data.user).toHaveProperty('role')
      expect(result.data.user).toHaveProperty('status')
    })

    it('should handle user with all possible roles', async () => {
      const roles = [Role.User, Role.Admin, Role.Owner, Role.Enterprise]

      for (const role of roles) {
        const userWithRole = { ...mockUser, role }
        mockUserRepo.findByEmail.mockImplementation(async () => userWithRole)

        const result = await logInWithEmail(mockLoginParams, mockDeviceInfo)
        expect(result.data.user.role).toBe(role)
      }
    })

    it('should handle user with all possible statuses', async () => {
      const statuses = [Status.New, Status.Verified, Status.Suspended]

      for (const status of statuses) {
        const userWithStatus = { ...mockUser, status }
        mockUserRepo.findByEmail.mockImplementation(async () => userWithStatus)

        await logInWithEmail(mockLoginParams, mockDeviceInfo)
        // Test passes if no error is thrown
      }
    })
  })
})
