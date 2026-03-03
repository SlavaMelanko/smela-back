import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import type { User } from '@/data'

import { ModuleMocker, testUuids } from '@/__tests__'
import { Role, Status } from '@/types'

import { getMeHandler, updateMeHandler } from '../handler'

const mockUser: User = {
  id: testUuids.USER_1,
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  role: Role.User,
  status: Status.Active,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

describe('getMeHandler', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockContext: any
  let mockJson: any
  let mockGetUser: any

  beforeEach(async () => {
    mockJson = mock((data: any) => ({ data }))

    mockContext = {
      get: mock(() => ({ id: testUuids.USER_1 })),
      json: mockJson,
    }

    mockGetUser = mock(async () => ({ user: mockUser }))

    await moduleMocker.mock('@/use-cases/user/me', () => ({
      getUser: mockGetUser,
    }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should call getUser with current user id', async () => {
    await getMeHandler(mockContext)

    expect(mockGetUser).toHaveBeenCalledWith(testUuids.USER_1)
  })

  it('should return user data', async () => {
    await getMeHandler(mockContext)

    expect(mockJson).toHaveBeenCalledWith({ user: mockUser })
  })

  it('should propagate error when getUser throws', async () => {
    mockGetUser.mockImplementation(async () => {
      throw new Error('User not found')
    })

    expect(getMeHandler(mockContext)).rejects.toThrow('User not found')
  })
})

describe('updateMeHandler', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockContext: any
  let mockJson: any
  let mockUpdateUser: any

  const body = { firstName: 'Jane', lastName: 'Smith' }
  const updatedUser: User = { ...mockUser, ...body, updatedAt: new Date('2024-01-02') }

  beforeEach(async () => {
    mockJson = mock((data: any) => ({ data }))

    mockContext = {
      get: mock(() => ({ id: testUuids.USER_1 })),
      req: { valid: mock(() => body) },
      json: mockJson,
    }

    mockUpdateUser = mock(async () => ({ user: updatedUser }))

    await moduleMocker.mock('@/use-cases/user/me', () => ({
      updateUser: mockUpdateUser,
    }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should call updateUser with current user id and body', async () => {
    await updateMeHandler(mockContext)

    expect(mockUpdateUser).toHaveBeenCalledWith(testUuids.USER_1, body)
  })

  it('should return updated user data', async () => {
    await updateMeHandler(mockContext)

    expect(mockJson).toHaveBeenCalledWith({ user: updatedUser })
  })

  it('should propagate error when updateUser throws', async () => {
    mockUpdateUser.mockImplementation(async () => {
      throw new Error('Update failed')
    })

    expect(updateMeHandler(mockContext)).rejects.toThrow('Update failed')
  })
})
