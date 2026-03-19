import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import type { User } from '@/data'

import { ModuleMocker, testUuids } from '@/__tests__'
import { AppError, ErrorCode } from '@/errors'
import { Role, Status } from '@/types'

import { changePasswordHandler, getMeHandler, updateMeHandler } from '../handler'

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

    await moduleMocker.mock('@/use-cases/user/me', () => ({ getUser: mockGetUser }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should call getUser and return user data', async () => {
    await getMeHandler(mockContext)

    expect(mockGetUser).toHaveBeenCalledWith(testUuids.USER_1)
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

    await moduleMocker.mock('@/use-cases/user/me', () => ({ updateUser: mockUpdateUser }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should call updateUser and return updated user data', async () => {
    await updateMeHandler(mockContext)

    expect(mockUpdateUser).toHaveBeenCalledWith(testUuids.USER_1, body)
    expect(mockJson).toHaveBeenCalledWith({ user: updatedUser })
  })

  it('should propagate error when updateUser throws', async () => {
    mockUpdateUser.mockImplementation(async () => {
      throw new Error('Update failed')
    })

    expect(updateMeHandler(mockContext)).rejects.toThrow('Update failed')
  })
})

describe('changePasswordHandler', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockContext: any
  let mockChangePassword: any
  let mockGetRefreshCookie: any

  beforeEach(async () => {
    mockContext = {
      get: mock(() => ({ id: testUuids.USER_1 })),
      req: { valid: mock(() => ({ currentPassword: 'OldPass1!', newPassword: 'NewPass1!' })) },
      json: mock((data: any) => ({ data })),
    }
    mockChangePassword = mock(async () => ({ success: true }))
    mockGetRefreshCookie = mock(() => 'raw-refresh-token')

    await moduleMocker.mock('@/use-cases/user/me', () => ({ changePassword: mockChangePassword }))
    await moduleMocker.mock('@/net/http/cookie/refresh-token', () => ({ getRefreshCookie: mockGetRefreshCookie }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should call changePassword with user id, passwords, and refresh token', async () => {
    await changePasswordHandler(mockContext)

    expect(mockGetRefreshCookie).toHaveBeenCalledWith(mockContext)
    expect(mockChangePassword).toHaveBeenCalledWith(
      testUuids.USER_1,
      'OldPass1!',
      'NewPass1!',
      'raw-refresh-token',
    )
    expect(mockContext.json).toHaveBeenCalledWith({ success: true })
  })

  it('should propagate InvalidCredentials error', async () => {
    mockChangePassword.mockImplementation(async () => {
      throw new AppError(ErrorCode.InvalidCredentials)
    })

    expect(changePasswordHandler(mockContext)).rejects.toMatchObject({
      code: ErrorCode.InvalidCredentials,
    })
  })
})
