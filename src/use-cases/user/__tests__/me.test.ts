import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import type { UpdateUserInput, User } from '@/data'

import { ModuleMocker } from '@/__tests__'
import { AppError, ErrorCode } from '@/errors'
import { Role, Status } from '@/types'

import { getUser, updateUser } from '../me'

describe('User Me Use Cases', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockUser: User
  let mockUserRepo: any

  beforeEach(async () => {
    mockUser = {
      id: 1,
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
      update: mock(async (_id: number, updates: UpdateUserInput) => ({
        ...mockUser,
        ...updates,
      })),
    }

    await moduleMocker.mock('@/data', () => ({
      userRepo: mockUserRepo,
    }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  describe('getUser', () => {
    it('should return user data when user exists', async () => {
      const result = await getUser(1)

      expect(result).toEqual({
        data: { user: mockUser },
      })
      expect(mockUserRepo.findById).toHaveBeenCalledWith(1)
      expect(mockUserRepo.findById).toHaveBeenCalledTimes(1)
    })

    it('should throw InternalError when user not found', async () => {
      mockUserRepo.findById.mockImplementation(async () => null)

      expect(getUser(999)).rejects.toThrow(AppError)
      expect(getUser(999)).rejects.toMatchObject({
        code: ErrorCode.InternalError,
      })
    })
  })

  describe('updateUser', () => {
    it('should update user with firstName and lastName', async () => {
      const result = await updateUser(1, { firstName: 'Jane', lastName: 'Smith' })

      expect(result.data.user.firstName).toBe('Jane')
      expect(result.data.user.lastName).toBe('Smith')
      expect(mockUserRepo.update).toHaveBeenCalledWith(1, {
        firstName: 'Jane',
        lastName: 'Smith',
        updatedAt: expect.any(Date),
      })
    })

    it('should update user with only firstName', async () => {
      const result = await updateUser(1, { firstName: 'Jane' })

      expect(result.data.user.firstName).toBe('Jane')
      expect(mockUserRepo.update).toHaveBeenCalledWith(1, {
        firstName: 'Jane',
        updatedAt: expect.any(Date),
      })
    })

    it('should update user with only lastName', async () => {
      const result = await updateUser(1, { lastName: 'Smith' })

      expect(result.data.user.lastName).toBe('Smith')
      expect(mockUserRepo.update).toHaveBeenCalledWith(1, {
        lastName: 'Smith',
        updatedAt: expect.any(Date),
      })
    })

    it('should return current user when no valid updates provided', async () => {
      const result = await updateUser(1, {})

      expect(result).toEqual({
        data: { user: mockUser },
      })
      expect(mockUserRepo.update).not.toHaveBeenCalled()
      expect(mockUserRepo.findById).toHaveBeenCalledWith(1)
    })

    it('should trim whitespace from names', async () => {
      const result = await updateUser(1, { firstName: '  Jane  ', lastName: '  Smith  ' })

      expect(result.data.user.firstName).toBe('Jane')
      expect(result.data.user.lastName).toBe('Smith')
      expect(mockUserRepo.update).toHaveBeenCalledWith(1, {
        firstName: 'Jane',
        lastName: 'Smith',
        updatedAt: expect.any(Date),
      })
    })

    it('should convert whitespace-only values to empty strings', async () => {
      const result = await updateUser(1, { firstName: '   ', lastName: 'Smith' })

      expect(result.data.user.firstName).toBe('')
      expect(result.data.user.lastName).toBe('Smith')
      expect(mockUserRepo.update).toHaveBeenCalledWith(1, {
        firstName: '',
        lastName: 'Smith',
        updatedAt: expect.any(Date),
      })
    })

    it('should update with empty strings when all values are whitespace-only', async () => {
      const result = await updateUser(1, { firstName: '   ', lastName: '   ' })

      expect(result.data.user.firstName).toBe('')
      expect(result.data.user.lastName).toBe('')
      expect(mockUserRepo.update).toHaveBeenCalledWith(1, {
        firstName: '',
        lastName: '',
        updatedAt: expect.any(Date),
      })
    })

    it('should ignore empty string values', async () => {
      const result = await updateUser(1, { firstName: '', lastName: 'Smith' })

      expect(result.data.user.lastName).toBe('Smith')
      expect(mockUserRepo.update).toHaveBeenCalledWith(1, {
        lastName: 'Smith',
        updatedAt: expect.any(Date),
      })
    })
  })
})
