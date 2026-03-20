import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import type { User } from '@/data'

import { ModuleMocker, testUuids } from '@/__tests__'
import { HttpStatus } from '@/net/http'
import { Role, Status } from '@/types'

import { getUserHandler, updateUserHandler } from '../handler'

describe('getUserHandler', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockContext: any
  let mockJson: any
  let mockGetUser: any

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

  beforeEach(async () => {
    mockJson = mock((data: any, status: number) => ({ data, status }))
    mockContext = {
      req: { valid: mock(() => ({ id: testUuids.USER_1 })) },
      json: mockJson,
    }
    mockGetUser = mock(async () => ({ user: mockUser }))

    await moduleMocker.mock('@/use-cases/admin', () => ({ getUser: mockGetUser }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should call getUser and return user with OK status', async () => {
    const result = await getUserHandler(mockContext)

    expect(mockGetUser).toHaveBeenCalledWith(testUuids.USER_1)
    expect(mockJson).toHaveBeenCalledWith({ user: mockUser }, HttpStatus.OK)
    expect(result.status).toBe(HttpStatus.OK)
  })

  it('should propagate error when getUser throws', async () => {
    mockGetUser.mockImplementation(async () => {
      throw new Error('User not found')
    })

    expect(getUserHandler(mockContext)).rejects.toThrow('User not found')
  })
})

describe('updateUserHandler', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockContext: any
  let mockJson: any
  let mockUpdateUser: any

  const body = { firstName: 'Jane', status: Status.Active }
  const updatedUser: User = {
    id: testUuids.USER_1,
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'john@example.com',
    role: Role.User,
    status: Status.Active,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
  }

  beforeEach(async () => {
    mockJson = mock((data: any, status: number) => ({ data, status }))
    mockContext = {
      req: {
        valid: mock((type: string) =>
          type === 'param' ? { id: testUuids.USER_1 } : body,
        ),
      },
      json: mockJson,
    }
    mockUpdateUser = mock(async () => ({ user: updatedUser }))

    await moduleMocker.mock('@/use-cases/admin', () => ({ updateUser: mockUpdateUser }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should call updateUser and return updated user with OK status', async () => {
    const result = await updateUserHandler(mockContext)

    expect(mockUpdateUser).toHaveBeenCalledWith(testUuids.USER_1, body)
    expect(mockJson).toHaveBeenCalledWith({ user: updatedUser }, HttpStatus.OK)
    expect(result.status).toBe(HttpStatus.OK)
  })

  it('should propagate error when updateUser throws', async () => {
    mockUpdateUser.mockImplementation(async () => {
      throw new Error('User not found')
    })

    expect(updateUserHandler(mockContext)).rejects.toThrow('User not found')
  })
})
