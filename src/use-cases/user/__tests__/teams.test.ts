import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import type { Team, TeamSearchResult, TeamWithMembers } from '@/data'

import { ModuleMocker, testUuids } from '@/__tests__'
import AppError from '@/errors/app-error'
import ErrorCode from '@/errors/codes'

import {
  createTeam,
  getTeam,
  getTeams,
  updateTeam,
} from '../teams'

const { TEAM_1 } = testUuids

describe('getTeams', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  const DEFAULT_PAGINATION = { page: 1, limit: 25 }

  let mockSearchResult: TeamSearchResult
  let mockTeamRepoSearch: any

  beforeEach(async () => {
    mockSearchResult = {
      teams: [
        {
          id: TEAM_1,
          name: 'Acme Corp',
          website: 'https://acme.com',
          description: 'A test team',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ],
      pagination: { page: 1, limit: 25, total: 1, totalPages: 1 },
    }

    mockTeamRepoSearch = mock(async () => mockSearchResult)

    await moduleMocker.mock('@/data', () => ({
      teamRepo: { search: mockTeamRepoSearch },
    }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should call teamRepo.search with correct params', async () => {
    await getTeams({ search: 'acme' }, DEFAULT_PAGINATION)

    expect(mockTeamRepoSearch).toHaveBeenCalledWith(
      { search: 'acme' },
      DEFAULT_PAGINATION,
    )
  })

  it('should return teams and pagination', async () => {
    const result = await getTeams({}, DEFAULT_PAGINATION)

    expect(result).toEqual(mockSearchResult)
  })
})

describe('getTeam', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockTeam: TeamWithMembers
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
      members: [],
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

  it('should return team when found (admin access, no userId)', async () => {
    const result = await getTeam(TEAM_1)

    expect(mockTeamRepoFind).toHaveBeenCalledWith(TEAM_1)
    expect(result).toEqual({ team: mockTeam })
  })

  it('should return team for authorized user', async () => {
    const result = await getTeam(TEAM_1, testUuids.USER_1)

    expect(mockTeamRepoFindMember).toHaveBeenCalledWith(testUuids.USER_1, TEAM_1)
    expect(mockTeamRepoFind).toHaveBeenCalledWith(TEAM_1)
    expect(result).toEqual({ team: mockTeam })
  })

  it('should throw Forbidden error for unauthorized user (prevents enumeration)', async () => {
    mockTeamRepoFindMember.mockImplementation(async () => undefined)

    expect(getTeam(TEAM_1, testUuids.USER_2)).rejects.toThrow(AppError)
    expect(getTeam(TEAM_1, testUuids.USER_2)).rejects.toMatchObject({
      code: ErrorCode.Forbidden,
      message: 'Not authorized to access this team',
    })
  })

  it('should throw Forbidden error for non-existent team (prevents enumeration)', async () => {
    mockTeamRepoFindMember.mockImplementation(async () => undefined)

    expect(getTeam(testUuids.NON_EXISTENT, testUuids.USER_1)).rejects.toThrow(AppError)
    expect(getTeam(testUuids.NON_EXISTENT, testUuids.USER_1)).rejects.toMatchObject({
      code: ErrorCode.Forbidden,
      message: 'Not authorized to access this team',
    })
  })

  it('should throw NotFound error when team does not exist (admin access)', async () => {
    mockTeamRepoFind.mockImplementation(async () => undefined)

    expect(getTeam(testUuids.NON_EXISTENT)).rejects.toThrow(AppError)
    expect(getTeam(testUuids.NON_EXISTENT)).rejects.toMatchObject({
      code: ErrorCode.NotFound,
      message: 'Team not found',
    })
  })
})

describe('createTeam', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockTeam: Team
  let mockTeamRepoCreate: any

  beforeEach(async () => {
    mockTeam = {
      id: TEAM_1,
      name: 'New Team',
      website: 'https://newteam.com',
      description: 'A new team',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    }

    mockTeamRepoCreate = mock(async () => mockTeam)

    await moduleMocker.mock('@/data', () => ({
      teamRepo: {
        create: mockTeamRepoCreate,
      },
    }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should create team', async () => {
    const params = { name: 'New Team', website: 'https://newteam.com' }

    const result = await createTeam(params)

    expect(mockTeamRepoCreate).toHaveBeenCalledWith(params)
    expect(result).toEqual({ team: mockTeam })
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

  it('should update team when it exists (admin access, no userId)', async () => {
    const params = { name: 'Updated Team' }

    const result = await updateTeam(TEAM_1, params)

    expect(mockTeamRepoFindById).toHaveBeenCalledWith(TEAM_1)
    expect(mockTeamRepoUpdate).toHaveBeenCalledWith(TEAM_1, params)
    expect(result).toEqual({ team: mockUpdatedTeam })
  })

  it('should update team for authorized user', async () => {
    const params = { name: 'Updated Team' }

    const result = await updateTeam(TEAM_1, params, testUuids.USER_1)

    expect(mockTeamRepoFindMember).toHaveBeenCalledWith(testUuids.USER_1, TEAM_1)
    expect(mockTeamRepoFindById).toHaveBeenCalledWith(TEAM_1)
    expect(mockTeamRepoUpdate).toHaveBeenCalledWith(TEAM_1, params)
    expect(result).toEqual({ team: mockUpdatedTeam })
  })

  it('should throw Forbidden error for unauthorized user (prevents enumeration)', async () => {
    mockTeamRepoFindMember.mockImplementation(async () => undefined)

    expect(updateTeam(TEAM_1, { name: 'Test' }, testUuids.USER_2)).rejects.toThrow(AppError)
    expect(updateTeam(TEAM_1, { name: 'Test' }, testUuids.USER_2)).rejects.toMatchObject({
      code: ErrorCode.Forbidden,
      message: 'Not authorized to update this team',
    })
  })

  it('should throw NotFound error when team does not exist (admin access)', async () => {
    mockTeamRepoFindById.mockImplementation(async () => undefined)

    expect(updateTeam(testUuids.NON_EXISTENT, { name: 'Test' })).rejects.toThrow(AppError)
    expect(updateTeam(testUuids.NON_EXISTENT, { name: 'Test' })).rejects.toMatchObject({
      code: ErrorCode.NotFound,
      message: 'Team not found',
    })
  })
})
