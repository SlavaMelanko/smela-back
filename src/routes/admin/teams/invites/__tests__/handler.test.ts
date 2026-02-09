import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import { ModuleMocker, testUuids } from '@/__tests__'
import { HttpStatus } from '@/net/http'

import { inviteMemberHandler, resendMemberInviteHandler } from '../handler'

const { TEAM_1, USER_1, USER_2 } = testUuids

describe('inviteMemberHandler', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockContext: any
  let mockJson: any
  let mockInviteMember: any

  const mockResult = {
    user: {
      id: USER_1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      status: 'pending',
      role: 'user',
    },
  }

  beforeEach(async () => {
    mockJson = mock((data: any, status: number) => ({ data, status }))

    mockContext = {
      req: {
        valid: mock((type: string) => {
          if (type === 'param') {
            return { teamId: TEAM_1 }
          }

          return {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            position: 'Developer',
          }
        }),
      },
      get: mock(() => ({ id: USER_2 })),
      json: mockJson,
    }

    mockInviteMember = mock(async () => mockResult)

    await moduleMocker.mock('@/use-cases/user', () => ({
      inviteMember: mockInviteMember,
    }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should call inviteMember with correct parameters', async () => {
    await inviteMemberHandler(mockContext)

    expect(mockInviteMember).toHaveBeenCalledWith(
      TEAM_1,
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        position: 'Developer',
      },
      USER_2,
    )
  })

  it('should return user with CREATED status', async () => {
    const result = await inviteMemberHandler(mockContext)

    expect(mockJson).toHaveBeenCalledWith(mockResult, HttpStatus.CREATED)
    expect(result.status).toBe(HttpStatus.CREATED)
  })

  it('should propagate error when inviteMember throws', async () => {
    mockInviteMember.mockImplementation(async () => {
      throw new Error('Team not found')
    })

    expect(inviteMemberHandler(mockContext)).rejects.toThrow('Team not found')
  })
})

describe('resendMemberInviteHandler', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockContext: any
  let mockJson: any
  let mockResendMemberInvite: any

  beforeEach(async () => {
    mockJson = mock((data: any, status: number) => ({ data, status }))

    mockContext = {
      req: {
        valid: mock(() => ({ teamId: TEAM_1, memberId: USER_1 })),
      },
      get: mock(() => ({ id: USER_2 })),
      json: mockJson,
    }

    mockResendMemberInvite = mock(async () => ({ success: true }))

    await moduleMocker.mock('@/use-cases/user', () => ({
      resendMemberInvite: mockResendMemberInvite,
    }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should call resendMemberInvite with correct parameters', async () => {
    await resendMemberInviteHandler(mockContext)

    expect(mockResendMemberInvite).toHaveBeenCalledWith(TEAM_1, USER_1, USER_2)
  })

  it('should return success with OK status', async () => {
    const result = await resendMemberInviteHandler(mockContext)

    expect(mockJson).toHaveBeenCalledWith({ success: true }, HttpStatus.OK)
    expect(result.status).toBe(HttpStatus.OK)
  })

  it('should propagate error when resendMemberInvite throws', async () => {
    mockResendMemberInvite.mockImplementation(async () => {
      throw new Error('Member not found')
    })

    expect(resendMemberInviteHandler(mockContext)).rejects.toThrow('Member not found')
  })
})
