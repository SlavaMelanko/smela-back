import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import type { UpdateUserInput, User, UserTeamInfo } from '@/data'

import { ModuleMocker, testUuids } from '@/__tests__'
import { AppError, ErrorCode } from '@/errors'
import { Role, Status } from '@/types'

import { changePassword, getUser, updateUser } from '../me'

describe('User Me Use Cases', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockUser: User
  let mockUserRepo: any
  let mockTeamRepo: any
  let mockTeam: UserTeamInfo | undefined
  let mockResolvePermissions: any

  beforeEach(async () => {
    mockUser = {
      id: testUuids.USER_1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'test@example.com',
      role: Role.User,
      status: Status.Active,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    }
    mockUserRepo = {
      findById: mock(async () => mockUser),
      update: mock(async (_id: string, updates: UpdateUserInput) => ({
        ...mockUser,
        ...updates,
      })),
    }
    mockTeam = undefined
    mockTeamRepo = {
      findUserTeam: mock(async () => mockTeam),
    }

    await moduleMocker.mock('@/data', () => ({
      userRepo: mockUserRepo,
      teamRepo: mockTeamRepo,
    }))

    mockResolvePermissions = mock(async () => undefined)

    await moduleMocker.mock('../../resolve-permissions', () => ({
      resolvePermissionList: mockResolvePermissions,
    }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  describe('getUser', () => {
    it('should return user, team undefined, and permissions when user has no team', async () => {
      const result = await getUser(testUuids.USER_1)

      expect(result).toEqual({ user: mockUser, team: undefined, permissions: undefined })
      expect(mockUserRepo.findById).toHaveBeenCalledWith(testUuids.USER_1)
      expect(mockTeamRepo.findUserTeam).toHaveBeenCalledWith(testUuids.USER_1)
    })

    it('should return user, team info, and permissions when user belongs to a team', async () => {
      mockTeam = {
        id: 'team-789',
        name: 'My Team',
        position: 'Product Manager',
      }
      mockTeamRepo.findUserTeam.mockImplementation(async () => mockTeam)

      const result = await getUser(testUuids.USER_1)

      expect(result).toEqual({ user: mockUser, team: mockTeam, permissions: undefined })
      expect(mockTeamRepo.findUserTeam).toHaveBeenCalledWith(testUuids.USER_1)
    })

    it('should throw InternalError when user not found', async () => {
      mockUserRepo.findById.mockImplementation(async () => null)

      expect(getUser(testUuids.NON_EXISTENT)).rejects.toThrow(AppError)
      expect(getUser(testUuids.NON_EXISTENT)).rejects.toMatchObject({
        code: ErrorCode.InternalError,
      })
    })
  })

  describe('changePassword', () => {
    let mockAuthRepo: any
    let mockRefreshTokenRepo: any
    let mockComparePasswordHashes: any
    let mockHashPassword: any
    let mockHashToken: any

    beforeEach(async () => {
      mockAuthRepo = {
        findById: mock(async () => ({ passwordHash: 'hashed' })),
        update: mock(async () => undefined),
      }
      mockRefreshTokenRepo = {
        revokeByUserId: mock(async () => undefined),
      }
      mockComparePasswordHashes = mock(async () => true)
      mockHashPassword = mock(async () => 'new-hashed')
      mockHashToken = mock(async () => 'hashed-token')

      await moduleMocker.mock('@/data', () => ({
        authRepo: mockAuthRepo,
        refreshTokenRepo: mockRefreshTokenRepo,
        userRepo: mockUserRepo,
        teamRepo: mockTeamRepo,
        db: {
          transaction: mock(async (callback: any) => callback({}) as Promise<void>),
        },
      }))

      await moduleMocker.mock('@/security/password', () => ({
        comparePasswordHashes: mockComparePasswordHashes,
        hashPassword: mockHashPassword,
      }))

      await moduleMocker.mock('@/security/token', () => ({
        hashToken: mockHashToken,
      }))
    })

    it('should update passwordHash and return success when current password is valid', async () => {
      const result = await changePassword(testUuids.USER_1, 'OldPass1!', 'NewPass1!')

      expect(result).toEqual({ success: true })
      expect(mockAuthRepo.findById).toHaveBeenCalledWith(testUuids.USER_1)
      expect(mockComparePasswordHashes).toHaveBeenCalledWith('OldPass1!', 'hashed')
      expect(mockHashPassword).toHaveBeenCalledWith('NewPass1!')
      expect(mockAuthRepo.update).toHaveBeenCalledWith(testUuids.USER_1, { passwordHash: 'new-hashed' }, {})
    })

    it('should revoke other sessions excluding current refresh token', async () => {
      await changePassword(testUuids.USER_1, 'OldPass1!', 'NewPass1!', 'raw-token')

      expect(mockHashToken).toHaveBeenCalledWith('raw-token')
      expect(mockRefreshTokenRepo.revokeByUserId).toHaveBeenCalledWith(testUuids.USER_1, 'hashed-token', {})
    })

    it('should revoke all sessions when no refresh token provided', async () => {
      await changePassword(testUuids.USER_1, 'OldPass1!', 'NewPass1!')

      expect(mockHashToken).not.toHaveBeenCalled()
      expect(mockRefreshTokenRepo.revokeByUserId).toHaveBeenCalledWith(
        testUuids.USER_1,
        undefined,
        {},
      )
    })

    it('should throw InvalidCredentials when auth record is not found', async () => {
      mockAuthRepo.findById.mockImplementation(async () => null)

      expect(changePassword(testUuids.USER_1, 'OldPass1!', 'NewPass1!')).rejects.toMatchObject({
        code: ErrorCode.InvalidCredentials,
      })
    })

    it('should throw InvalidCredentials when auth has no passwordHash', async () => {
      mockAuthRepo.findById.mockImplementation(async () => ({ passwordHash: null }))

      expect(changePassword(testUuids.USER_1, 'OldPass1!', 'NewPass1!')).rejects.toMatchObject({
        code: ErrorCode.InvalidCredentials,
      })
    })

    it('should throw InvalidPassword when current password does not match', async () => {
      mockComparePasswordHashes.mockImplementation(async () => false)

      expect(changePassword(testUuids.USER_1, 'WrongPass1!', 'NewPass1!')).rejects.toMatchObject({
        code: ErrorCode.InvalidPassword,
      })
    })
  })

  describe('updateUser', () => {
    it('should update user with firstName and lastName', async () => {
      const result = await updateUser(testUuids.USER_1, { firstName: 'Jane', lastName: 'Smith' })

      expect(result.user.firstName).toBe('Jane')
      expect(result.user.lastName).toBe('Smith')
      expect(result.team).toBeUndefined()
      expect(mockUserRepo.update).toHaveBeenCalledWith(testUuids.USER_1, {
        firstName: 'Jane',
        lastName: 'Smith',
        updatedAt: expect.any(Date),
      })
    })

    it('should update user with only firstName', async () => {
      const result = await updateUser(testUuids.USER_1, { firstName: 'Jane' })

      expect(result.user.firstName).toBe('Jane')
      expect(result.team).toBeUndefined()
      expect(mockUserRepo.update).toHaveBeenCalledWith(testUuids.USER_1, {
        firstName: 'Jane',
        updatedAt: expect.any(Date),
      })
    })

    it('should update user with only lastName', async () => {
      const result = await updateUser(testUuids.USER_1, { lastName: 'Smith' })

      expect(result.user.lastName).toBe('Smith')
      expect(result.team).toBeUndefined()
      expect(mockUserRepo.update).toHaveBeenCalledWith(testUuids.USER_1, {
        lastName: 'Smith',
        updatedAt: expect.any(Date),
      })
    })

    it('should return current user, team, and permissions when no valid updates provided', async () => {
      const result = await updateUser(testUuids.USER_1, {})

      expect(result).toEqual({ user: mockUser, team: undefined, permissions: undefined })
      expect(mockUserRepo.update).not.toHaveBeenCalled()
      expect(mockUserRepo.findById).toHaveBeenCalledWith(testUuids.USER_1)
    })

    it('should allow clearing lastName with empty string', async () => {
      // lastName: '' is valid (clears the field)
      const result = await updateUser(testUuids.USER_1, { firstName: 'Jane', lastName: '' })

      expect(result.user.firstName).toBe('Jane')
      expect(result.user.lastName).toBe('')
      expect(result.team).toBeUndefined()
      expect(mockUserRepo.update).toHaveBeenCalledWith(testUuids.USER_1, {
        firstName: 'Jane',
        lastName: '',
        updatedAt: expect.any(Date),
      })
    })

    it('should filter undefined values only', async () => {
      // undefined = don't touch, empty string = include
      const result = await updateUser(testUuids.USER_1, { firstName: undefined, lastName: 'Smith' })

      expect(result.user.lastName).toBe('Smith')
      expect(result.team).toBeUndefined()
      expect(mockUserRepo.update).toHaveBeenCalledWith(testUuids.USER_1, {
        lastName: 'Smith',
        updatedAt: expect.any(Date),
      })
    })
  })
})
