import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import type { Team, TeamWithMemberCount } from '@/data'

import { ModuleMocker, testUuids } from '@/__tests__'
import AppError from '@/errors/app-error'
import ErrorCode from '@/errors/codes'

import {
  getTeam,
  updateTeam,
} from '../teams'

const { TEAM_1 } = testUuids

describe('getTeam', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockTeam: TeamWithMemberCount
  let mockTeamRepoFind: any
  let mockTeamRepoFindMember: any

  beforeEach(async () => {
    mockTeam = {
      id: TEAM_1,
      name: 'Acme Corp',
      website: 'https://acme.com',
      description: 'A test team',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      memberCount: 0,
    }

    mockTeamRepoFind = mock(async () => mockTeam)
    mockTeamRepoFindMember = mock(async () => ({ userId: testUuids.USER_1, teamId: TEAM_1 }))

    await moduleMocker.mock('@/data', () => ({
      teamRepo: {
        find: mockTeamRepoFind,
        findMember: mockTeamRepoFindMember,
      },
    }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should return team when found', async () => {
    const result = await getTeam(TEAM_1)

    expect(mockTeamRepoFind).toHaveBeenCalledWith(TEAM_1)
    expect(result).toEqual({ team: mockTeam })
  })

  it('should throw NotFound error when team does not exist', async () => {
    mockTeamRepoFind.mockImplementation(async () => undefined)

    expect(getTeam(testUuids.NON_EXISTENT)).rejects.toThrow(AppError)
    expect(getTeam(testUuids.NON_EXISTENT)).rejects.toMatchObject({
      code: ErrorCode.NotFound,
      message: 'Team not found',
    })
  })
})

describe('updateTeam', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockExistingTeam: Team
  let mockUpdatedTeam: Team
  let mockTeamRepoFindById: any
  let mockTeamRepoUpdate: any
  let mockTeamRepoFindMember: any

  beforeEach(async () => {
    mockExistingTeam = {
      id: TEAM_1,
      name: 'Old Team',
      website: 'https://oldteam.com',
      description: 'An old team',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    }

    mockUpdatedTeam = {
      ...mockExistingTeam,
      name: 'Updated Team',
      updatedAt: new Date('2024-01-02'),
    }

    mockTeamRepoFindById = mock(async () => mockExistingTeam)
    mockTeamRepoUpdate = mock(async () => mockUpdatedTeam)
    mockTeamRepoFindMember = mock(async () => ({ userId: testUuids.USER_1, teamId: TEAM_1 }))

    await moduleMocker.mock('@/data', () => ({
      teamRepo: {
        findById: mockTeamRepoFindById,
        update: mockTeamRepoUpdate,
        findMember: mockTeamRepoFindMember,
      },
    }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should update team when it exists', async () => {
    const params = { name: 'Updated Team' }

    const result = await updateTeam(TEAM_1, params)

    expect(mockTeamRepoFindById).toHaveBeenCalledWith(TEAM_1)
    expect(mockTeamRepoUpdate).toHaveBeenCalledWith(TEAM_1, params)
    expect(result).toEqual({ team: mockUpdatedTeam })
  })

  it('should throw NotFound error when team does not exist', async () => {
    mockTeamRepoFindById.mockImplementation(async () => undefined)

    expect(updateTeam(testUuids.NON_EXISTENT, { name: 'Test' })).rejects.toThrow(AppError)
    expect(updateTeam(testUuids.NON_EXISTENT, { name: 'Test' })).rejects.toMatchObject({
      code: ErrorCode.NotFound,
      message: 'Team not found',
    })
  })
})
