import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import { ModuleMocker, testUuids } from '@/__tests__'
import { HttpStatus } from '@/net/http'

import {
  cancelMemberInviteHandler,
  getTeamMemberHandler,
  removeTeamMemberHandler,
  resendMemberInviteHandler,
  updateTeamMemberHandler,
} from '../handler'

const mockMember = {
  id: testUuids.USER_1,
  firstName: 'Alice',
  email: 'alice@example.com',
}

const mockParams = { teamId: testUuids.TEAM_1, memberId: testUuids.USER_1 }

describe('getTeamMemberHandler', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockContext: any
  let mockJson: any
  let mockGetTeamMember: any

  beforeEach(async () => {
    mockJson = mock((data: any, status: number) => ({ data, status }))
    mockContext = {
      req: { valid: mock(() => mockParams) },
      json: mockJson,
    }
    mockGetTeamMember = mock(async () => ({ member: mockMember }))

    await moduleMocker.mock('@/use-cases/user', () => ({ getTeamMember: mockGetTeamMember }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should call getTeamMember and return member with OK status', async () => {
    const result = await getTeamMemberHandler(mockContext)

    expect(mockGetTeamMember).toHaveBeenCalledWith(testUuids.TEAM_1, testUuids.USER_1)
    expect(mockJson).toHaveBeenCalledWith({ member: mockMember }, HttpStatus.OK)
    expect(result.status).toBe(HttpStatus.OK)
  })

  it('should propagate error when getTeamMember throws', async () => {
    mockGetTeamMember.mockImplementation(async () => {
      throw new Error('Member not found')
    })

    expect(getTeamMemberHandler(mockContext)).rejects.toThrow('Member not found')
  })
})

describe('updateTeamMemberHandler', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockContext: any
  let mockJson: any
  let mockUpdateTeamMember: any

  const body = { position: 'Lead' }
  const updatedMember = { ...mockMember, position: 'Lead' }

  beforeEach(async () => {
    mockJson = mock((data: any, status: number) => ({ data, status }))
    mockContext = {
      req: {
        valid: mock((type: string) => (type === 'param' ? mockParams : body)),
      },
      json: mockJson,
    }
    mockUpdateTeamMember = mock(async () => ({ member: updatedMember }))

    await moduleMocker.mock('@/use-cases/user', () => ({ updateTeamMember: mockUpdateTeamMember }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should call updateTeamMember and return updated member with OK status', async () => {
    const result = await updateTeamMemberHandler(mockContext)

    expect(mockUpdateTeamMember).toHaveBeenCalledWith(testUuids.TEAM_1, testUuids.USER_1, body)
    expect(mockJson).toHaveBeenCalledWith({ member: updatedMember }, HttpStatus.OK)
    expect(result.status).toBe(HttpStatus.OK)
  })

  it('should propagate error when updateTeamMember throws', async () => {
    mockUpdateTeamMember.mockImplementation(async () => {
      throw new Error('Member not found')
    })

    expect(updateTeamMemberHandler(mockContext)).rejects.toThrow('Member not found')
  })
})

describe('removeTeamMemberHandler', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockContext: any
  let mockJson: any
  let mockRemoveTeamMember: any

  beforeEach(async () => {
    mockJson = mock((data: any, status: number) => ({ data, status }))
    mockContext = {
      req: { valid: mock(() => mockParams) },
      json: mockJson,
    }
    mockRemoveTeamMember = mock(async () => ({ success: true }))

    await moduleMocker.mock('@/use-cases/user', () => ({ removeTeamMember: mockRemoveTeamMember }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should call removeTeamMember and return success with OK status', async () => {
    const result = await removeTeamMemberHandler(mockContext)

    expect(mockRemoveTeamMember).toHaveBeenCalledWith(testUuids.TEAM_1, testUuids.USER_1)
    expect(mockJson).toHaveBeenCalledWith({ success: true }, HttpStatus.OK)
    expect(result.status).toBe(HttpStatus.OK)
  })

  it('should propagate error when removeTeamMember throws', async () => {
    mockRemoveTeamMember.mockImplementation(async () => {
      throw new Error('Member not found')
    })

    expect(removeTeamMemberHandler(mockContext)).rejects.toThrow('Member not found')
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
      req: { valid: mock(() => mockParams) },
      get: mock(() => ({ id: testUuids.USER_2 })),
      json: mockJson,
    }
    mockResendMemberInvite = mock(async () => ({ success: true }))

    await moduleMocker.mock('@/use-cases/user', () => ({ resendMemberInvite: mockResendMemberInvite }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should call resendMemberInvite and return result with OK status', async () => {
    const result = await resendMemberInviteHandler(mockContext)

    expect(mockResendMemberInvite).toHaveBeenCalledWith(
      testUuids.TEAM_1,
      testUuids.USER_1,
      testUuids.USER_2,
    )
    expect(mockJson).toHaveBeenCalledWith({ success: true }, HttpStatus.OK)
    expect(result.status).toBe(HttpStatus.OK)
  })

  it('should propagate error when resendMemberInvite throws', async () => {
    mockResendMemberInvite.mockImplementation(async () => {
      throw new Error('Invite already accepted')
    })

    expect(resendMemberInviteHandler(mockContext)).rejects.toThrow('Invite already accepted')
  })
})

describe('cancelMemberInviteHandler', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockContext: any
  let mockJson: any
  let mockCancelMemberInvite: any

  beforeEach(async () => {
    mockJson = mock((data: any, status: number) => ({ data, status }))
    mockContext = {
      req: { valid: mock(() => mockParams) },
      json: mockJson,
    }
    mockCancelMemberInvite = mock(async () => ({ success: true }))

    await moduleMocker.mock('@/use-cases/user', () => ({ cancelMemberInvite: mockCancelMemberInvite }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should call cancelMemberInvite and return result with OK status', async () => {
    const result = await cancelMemberInviteHandler(mockContext)

    expect(mockCancelMemberInvite).toHaveBeenCalledWith(testUuids.TEAM_1, testUuids.USER_1)
    expect(mockJson).toHaveBeenCalledWith({ success: true }, HttpStatus.OK)
    expect(result.status).toBe(HttpStatus.OK)
  })

  it('should propagate error when cancelMemberInvite throws', async () => {
    mockCancelMemberInvite.mockImplementation(async () => {
      throw new Error('Invite not found')
    })

    expect(cancelMemberInviteHandler(mockContext)).rejects.toThrow('Invite not found')
  })
})
