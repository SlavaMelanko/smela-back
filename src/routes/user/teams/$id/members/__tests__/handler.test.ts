import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import { ModuleMocker, testUuids } from '@/__tests__'
import { HttpStatus } from '@/net/http'
import { Resource } from '@/types'

import {
  createMemberHandler,
  getMemberDefaultPermissionsHandler,
  getTeamMembersHandler,
} from '../handler'

describe('getMemberDefaultPermissionsHandler', () => {
  let mockJson: ReturnType<typeof mock>
  let mockContext: { json: typeof mockJson }

  beforeEach(() => {
    mockJson = mock((data: unknown, status: number) => ({ data, status }))
    mockContext = { json: mockJson }
  })

  it('should return default member permissions with OK status', () => {
    getMemberDefaultPermissionsHandler(mockContext as any, async () => {})

    expect(mockJson).toHaveBeenCalledWith(
      {
        permissions: {
          [Resource.Users]: { view: true },
          [Resource.Teams]: { view: true },
        },
      },
      HttpStatus.OK,
    )
  })
})

describe('getTeamMembersHandler', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockContext: any
  let mockJson: any
  let mockGetTeamMembers: any

  const mockMembers = [{ id: testUuids.USER_1, firstName: 'Alice' }]

  beforeEach(async () => {
    mockJson = mock((data: any, status: number) => ({ data, status }))
    mockContext = {
      req: { valid: mock(() => ({ teamId: testUuids.TEAM_1 })) },
      json: mockJson,
    }
    mockGetTeamMembers = mock(async () => ({ members: mockMembers }))

    await moduleMocker.mock('@/use-cases/user', () => ({ getTeamMembers: mockGetTeamMembers }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should call getTeamMembers and return members with OK status', async () => {
    const result = await getTeamMembersHandler(mockContext)

    expect(mockGetTeamMembers).toHaveBeenCalledWith(testUuids.TEAM_1)
    expect(mockJson).toHaveBeenCalledWith({ members: mockMembers }, HttpStatus.OK)
    expect(result.status).toBe(HttpStatus.OK)
  })

  it('should propagate error when getTeamMembers throws', async () => {
    mockGetTeamMembers.mockImplementation(async () => {
      throw new Error('Team not found')
    })

    expect(getTeamMembersHandler(mockContext)).rejects.toThrow('Team not found')
  })
})

describe('createMemberHandler', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockContext: any
  let mockJson: any
  let mockInviteMember: any

  const body = {
    firstName: 'Bob',
    email: 'bob@example.com',
    permissions: {},
  }

  beforeEach(async () => {
    mockJson = mock((data: any, status: number) => ({ data, status }))
    mockContext = {
      req: {
        valid: mock((type: string) =>
          type === 'param' ? { teamId: testUuids.TEAM_1 } : body,
        ),
      },
      get: mock(() => ({ id: testUuids.USER_1 })),
      json: mockJson,
    }
    mockInviteMember = mock(async () => ({ member: { id: testUuids.USER_2, ...body } }))

    await moduleMocker.mock('@/use-cases/user', () => ({ inviteMember: mockInviteMember }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should call inviteMember and return created member with CREATED status', async () => {
    const result = await createMemberHandler(mockContext)

    expect(mockInviteMember).toHaveBeenCalledWith(testUuids.TEAM_1, body, testUuids.USER_1)
    expect(mockJson).toHaveBeenCalledWith(
      { member: { id: testUuids.USER_2, ...body } },
      HttpStatus.CREATED,
    )
    expect(result.status).toBe(HttpStatus.CREATED)
  })

  it('should propagate error when inviteMember throws', async () => {
    mockInviteMember.mockImplementation(async () => {
      throw new Error('Email already a member')
    })

    expect(createMemberHandler(mockContext)).rejects.toThrow('Email already a member')
  })
})
