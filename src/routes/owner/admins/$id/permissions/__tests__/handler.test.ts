import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import { ModuleMocker, testUuids } from '@/__tests__'
import { HttpStatus } from '@/net/http'

import {
  getAdminPermissionsHandler,
  updateAdminPermissionsHandler,
} from '../handler'

const mockPermissions = {
  users: { view: true, manage: true },
  teams: { view: true, manage: true },
}

describe('getAdminPermissionsHandler', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockContext: any
  let mockJson: any
  let mockGetAdminPermissions: any

  beforeEach(async () => {
    mockJson = mock((data: any, status: number) => ({ data, status }))
    mockContext = {
      req: { valid: mock(() => ({ adminId: testUuids.ADMIN_1 })) },
      json: mockJson,
    }
    mockGetAdminPermissions = mock(async () => ({ permissions: mockPermissions }))

    await moduleMocker.mock('@/use-cases/owner', () => ({ getAdminPermissions: mockGetAdminPermissions }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should call getAdminPermissions and return permissions with OK status', async () => {
    const result = await getAdminPermissionsHandler(mockContext)

    expect(mockGetAdminPermissions).toHaveBeenCalledWith(testUuids.ADMIN_1)
    expect(mockJson).toHaveBeenCalledWith({ permissions: mockPermissions }, HttpStatus.OK)
    expect(result.status).toBe(HttpStatus.OK)
  })

  it('should propagate error when getAdminPermissions throws', async () => {
    mockGetAdminPermissions.mockImplementation(async () => {
      throw new Error('Admin not found')
    })

    expect(getAdminPermissionsHandler(mockContext)).rejects.toThrow('Admin not found')
  })
})

describe('updateAdminPermissionsHandler', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockContext: any
  let mockJson: any
  let mockUpdateAdminPermissions: any

  const updatedPermissions = {
    users: { view: true, manage: false },
    teams: { view: true, manage: true },
  }

  beforeEach(async () => {
    mockJson = mock((data: any, status: number) => ({ data, status }))
    mockContext = {
      req: {
        valid: mock((type: string) =>
          type === 'param'
            ? { adminId: testUuids.ADMIN_1 }
            : { permissions: updatedPermissions },
        ),
      },
      json: mockJson,
    }
    mockUpdateAdminPermissions = mock(async () => ({ permissions: updatedPermissions }))

    await moduleMocker.mock('@/use-cases/owner', () => ({ updateAdminPermissions: mockUpdateAdminPermissions }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should call updateAdminPermissions and return updated permissions with OK status', async () => {
    const result = await updateAdminPermissionsHandler(mockContext)

    expect(mockUpdateAdminPermissions).toHaveBeenCalledWith(testUuids.ADMIN_1, updatedPermissions)
    expect(mockJson).toHaveBeenCalledWith({ permissions: updatedPermissions }, HttpStatus.OK)
    expect(result.status).toBe(HttpStatus.OK)
  })

  it('should propagate error when updateAdminPermissions throws', async () => {
    mockUpdateAdminPermissions.mockImplementation(async () => {
      throw new Error('Admin not found')
    })

    expect(updateAdminPermissionsHandler(mockContext)).rejects.toThrow('Admin not found')
  })
})
