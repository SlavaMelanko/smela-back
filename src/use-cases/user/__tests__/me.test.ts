import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import type { UpdateUserInput, User, UserTeamInfo } from '@/data'

import { ModuleMocker, testUuids } from '@/__tests__'
import { AppError, ErrorCode } from '@/errors'
import { Role, Status } from '@/types'

import { getUser, updateUser } from '../me'

describe('User Me Use Cases', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockUser: User
  let mockUserRepo: any
  let mockTeamRepo: any
  let mockTeam: UserTeamInfo | undefined

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
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  describe('getUser', () => {
    it('should return user and team null when user has no team', async () => {
      const result = await getUser(testUuids.USER_1)

      expect(result).toEqual({ user: mockUser, team: null })
      expect(mockUserRepo.findById).toHaveBeenCalledWith(testUuids.USER_1)
      expect(mockTeamRepo.findUserTeam).toHaveBeenCalledWith(testUuids.USER_1)
    })

    it('should return user and team info when user belongs to a team', async () => {
      mockTeam = {
        id: 'team-789',
        name: 'My Team',
        position: 'Product Manager',
      }
      mockTeamRepo.findUserTeam.mockImplementation(async () => mockTeam)

      const result = await getUser(testUuids.USER_1)

      expect(result).toEqual({ user: mockUser, team: mockTeam })
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

  describe('updateUser', () => {
    it('should update user with firstName and lastName', async () => {
      const result = await updateUser(testUuids.USER_1, { firstName: 'Jane', lastName: 'Smith' })

      expect(result.user.firstName).toBe('Jane')
      expect(result.user.lastName).toBe('Smith')
      expect(result.team).toBeNull()
      expect(mockUserRepo.update).toHaveBeenCalledWith(testUuids.USER_1, {
        firstName: 'Jane',
        lastName: 'Smith',
        updatedAt: expect.any(Date),
      })
    })

    it('should update user with only firstName', async () => {
      const result = await updateUser(testUuids.USER_1, { firstName: 'Jane' })

      expect(result.user.firstName).toBe('Jane')
      expect(result.team).toBeNull()
      expect(mockUserRepo.update).toHaveBeenCalledWith(testUuids.USER_1, {
        firstName: 'Jane',
        updatedAt: expect.any(Date),
      })
    })

    it('should update user with only lastName', async () => {
      const result = await updateUser(testUuids.USER_1, { lastName: 'Smith' })

      expect(result.user.lastName).toBe('Smith')
      expect(result.team).toBeNull()
      expect(mockUserRepo.update).toHaveBeenCalledWith(testUuids.USER_1, {
        lastName: 'Smith',
        updatedAt: expect.any(Date),
      })
    })

    it('should return current user and team when no valid updates provided', async () => {
      const result = await updateUser(testUuids.USER_1, {})

      expect(result).toEqual({ user: mockUser, team: null })
      expect(mockUserRepo.update).not.toHaveBeenCalled()
      expect(mockUserRepo.findById).toHaveBeenCalledWith(testUuids.USER_1)
    })

    it('should allow clearing lastName with empty string', async () => {
      // lastName: '' is valid (clears the field)
      const result = await updateUser(testUuids.USER_1, { firstName: 'Jane', lastName: '' })

      expect(result.user.firstName).toBe('Jane')
      expect(result.user.lastName).toBe('')
      expect(result.team).toBeNull()
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
      expect(result.team).toBeNull()
      expect(mockUserRepo.update).toHaveBeenCalledWith(testUuids.USER_1, {
        lastName: 'Smith',
        updatedAt: expect.any(Date),
      })
    })
  })
})
