import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import type { User } from '@/data'

import { ModuleMocker, testUuids } from '@/__tests__'
import { HttpStatus } from '@/net/http'
import { Role, Status } from '@/types'

import {
  cancelAdminInviteHandler,
  getAdminHandler,
  resendAdminInviteHandler,
  updateAdminHandler,
} from '../handler'

const mockAdmin: User = {
  id: testUuids.ADMIN_1,
  firstName: 'Admin',
  lastName: 'User',
  email: 'admin@example.com',
  role: Role.Admin,
  status: Status.Active,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

describe('getAdminHandler', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockContext: any
  let mockJson: any
  let mockGetAdmin: any

  beforeEach(async () => {
    mockJson = mock((data: any, status: number) => ({ data, status }))
    mockContext = {
      req: { valid: mock(() => ({ adminId: testUuids.ADMIN_1 })) },
      json: mockJson,
    }
    mockGetAdmin = mock(async () => ({ admin: mockAdmin }))

    await moduleMocker.mock('@/use-cases/owner', () => ({ getAdmin: mockGetAdmin }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should call getAdmin and return admin with OK status', async () => {
    const result = await getAdminHandler(mockContext)

    expect(mockGetAdmin).toHaveBeenCalledWith(testUuids.ADMIN_1)
    expect(mockJson).toHaveBeenCalledWith({ admin: mockAdmin }, HttpStatus.OK)
    expect(result.status).toBe(HttpStatus.OK)
  })

  it('should propagate error when getAdmin throws', async () => {
    mockGetAdmin.mockImplementation(async () => {
      throw new Error('Admin not found')
    })

    expect(getAdminHandler(mockContext)).rejects.toThrow('Admin not found')
  })
})

describe('updateAdminHandler', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockContext: any
  let mockJson: any
  let mockUpdateAdmin: any

  const updatedAdmin: User = {
    ...mockAdmin,
    firstName: 'Updated',
    lastName: 'Name',
    updatedAt: new Date('2024-01-02'),
  }

  beforeEach(async () => {
    mockJson = mock((data: any, status: number) => ({ data, status }))
    mockContext = {
      req: {
        valid: mock((type: string) =>
          type === 'param'
            ? { adminId: testUuids.ADMIN_1 }
            : { firstName: 'Updated', lastName: 'Name' },
        ),
      },
      json: mockJson,
    }
    mockUpdateAdmin = mock(async () => ({ admin: updatedAdmin }))

    await moduleMocker.mock('@/use-cases/owner', () => ({ updateAdmin: mockUpdateAdmin }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should call updateAdmin and return updated admin with OK status', async () => {
    const result = await updateAdminHandler(mockContext)

    expect(mockUpdateAdmin).toHaveBeenCalledWith(testUuids.ADMIN_1, { firstName: 'Updated', lastName: 'Name' })
    expect(mockJson).toHaveBeenCalledWith({ admin: updatedAdmin }, HttpStatus.OK)
    expect(result.status).toBe(HttpStatus.OK)
  })

  it('should propagate error when updateAdmin throws', async () => {
    mockUpdateAdmin.mockImplementation(async () => {
      throw new Error('Admin not found')
    })

    expect(updateAdminHandler(mockContext)).rejects.toThrow('Admin not found')
  })
})

describe('resendAdminInviteHandler', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockContext: any
  let mockJson: any
  let mockResendAdminInvite: any

  beforeEach(async () => {
    mockJson = mock((data: any, status: number) => ({ data, status }))
    mockContext = {
      req: { valid: mock(() => ({ adminId: testUuids.ADMIN_1 })) },
      get: mock(() => ({ id: testUuids.OWNER_1 })),
      json: mockJson,
    }
    mockResendAdminInvite = mock(async () => ({ success: true }))

    await moduleMocker.mock('@/use-cases/owner', () => ({ resendAdminInvite: mockResendAdminInvite }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should call resendAdminInvite and return result with OK status', async () => {
    const result = await resendAdminInviteHandler(mockContext)

    expect(mockResendAdminInvite).toHaveBeenCalledWith(testUuids.ADMIN_1, testUuids.OWNER_1)
    expect(mockJson).toHaveBeenCalledWith({ success: true }, HttpStatus.OK)
    expect(result.status).toBe(HttpStatus.OK)
  })

  it('should propagate error when resendAdminInvite throws', async () => {
    mockResendAdminInvite.mockImplementation(async () => {
      throw new Error('Invite already accepted')
    })

    expect(resendAdminInviteHandler(mockContext)).rejects.toThrow('Invite already accepted')
  })
})

describe('cancelAdminInviteHandler', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockContext: any
  let mockJson: any
  let mockCancelAdminInvite: any

  beforeEach(async () => {
    mockJson = mock((data: any, status: number) => ({ data, status }))
    mockContext = {
      req: { valid: mock(() => ({ adminId: testUuids.ADMIN_1 })) },
      json: mockJson,
    }
    mockCancelAdminInvite = mock(async () => ({ success: true }))

    await moduleMocker.mock('@/use-cases/owner', () => ({ cancelAdminInvite: mockCancelAdminInvite }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should call cancelAdminInvite and return result with OK status', async () => {
    const result = await cancelAdminInviteHandler(mockContext)

    expect(mockCancelAdminInvite).toHaveBeenCalledWith(testUuids.ADMIN_1)
    expect(mockJson).toHaveBeenCalledWith({ success: true }, HttpStatus.OK)
    expect(result.status).toBe(HttpStatus.OK)
  })

  it('should propagate error when cancelAdminInvite throws', async () => {
    mockCancelAdminInvite.mockImplementation(async () => {
      throw new Error('Invite not found')
    })

    expect(cancelAdminInviteHandler(mockContext)).rejects.toThrow('Invite not found')
  })
})
