import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import { ModuleMocker, testUuids } from '@/__tests__'
import { HttpStatus } from '@/net/http'

import { getTeamHandler, updateTeamHandler } from '../handler'

const mockTeam = {
  id: testUuids.TEAM_1,
  name: 'Engineering',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

describe('getTeamHandler', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockContext: any
  let mockJson: any
  let mockGetTeam: any

  beforeEach(async () => {
    mockJson = mock((data: any, status: number) => ({ data, status }))
    mockContext = {
      req: { valid: mock(() => ({ teamId: testUuids.TEAM_1 })) },
      json: mockJson,
    }
    mockGetTeam = mock(async () => ({ team: mockTeam }))

    await moduleMocker.mock('@/use-cases/user', () => ({ getTeam: mockGetTeam }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should call getTeam and return team with OK status', async () => {
    const result = await getTeamHandler(mockContext)

    expect(mockGetTeam).toHaveBeenCalledWith(testUuids.TEAM_1)
    expect(mockJson).toHaveBeenCalledWith({ team: mockTeam }, HttpStatus.OK)
    expect(result.status).toBe(HttpStatus.OK)
  })

  it('should propagate error when getTeam throws', async () => {
    mockGetTeam.mockImplementation(async () => {
      throw new Error('Team not found')
    })

    expect(getTeamHandler(mockContext)).rejects.toThrow('Team not found')
  })
})

describe('updateTeamHandler', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockContext: any
  let mockJson: any
  let mockUpdateTeam: any

  const body = { name: 'Platform', description: 'Platform team' }
  const updatedTeam = { ...mockTeam, ...body, updatedAt: new Date('2024-01-02') }

  beforeEach(async () => {
    mockJson = mock((data: any, status: number) => ({ data, status }))
    mockContext = {
      req: {
        valid: mock((type: string) =>
          type === 'param' ? { teamId: testUuids.TEAM_1 } : body,
        ),
      },
      json: mockJson,
    }
    mockUpdateTeam = mock(async () => ({ team: updatedTeam }))

    await moduleMocker.mock('@/use-cases/user', () => ({ updateTeam: mockUpdateTeam }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should call updateTeam and return updated team with OK status', async () => {
    const result = await updateTeamHandler(mockContext)

    expect(mockUpdateTeam).toHaveBeenCalledWith(testUuids.TEAM_1, body)
    expect(mockJson).toHaveBeenCalledWith({ team: updatedTeam }, HttpStatus.OK)
    expect(result.status).toBe(HttpStatus.OK)
  })

  it('should propagate error when updateTeam throws', async () => {
    mockUpdateTeam.mockImplementation(async () => {
      throw new Error('Team not found')
    })

    expect(updateTeamHandler(mockContext)).rejects.toThrow('Team not found')
  })
})
