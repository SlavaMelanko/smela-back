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

const { TEAM_1, TEAM_2 } = testUuids

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

    await moduleMocker.mock('@/data', () => ({
      teamRepo: { find: mockTeamRepoFind },
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

describe('createTeam', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockTeam: Team
  let mockTeamRepoFindByName: any
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

    mockTeamRepoFindByName = mock(async () => undefined)
    mockTeamRepoCreate = mock(async () => mockTeam)

    await moduleMocker.mock('@/data', () => ({
      teamRepo: {
        findByName: mockTeamRepoFindByName,
        create: mockTeamRepoCreate,
      },
    }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should create team when name is unique', async () => {
    const params = { name: 'New Team', website: 'https://newteam.com' }

    const result = await createTeam(params)

    expect(mockTeamRepoFindByName).toHaveBeenCalledWith('New Team')
    expect(mockTeamRepoCreate).toHaveBeenCalledWith(params)
    expect(result).toEqual({ team: mockTeam })
  })

  it('should throw Conflict error when team name already exists', async () => {
    mockTeamRepoFindByName.mockImplementation(async () => mockTeam)

    expect(createTeam({ name: 'New Team' })).rejects.toThrow(AppError)
    expect(createTeam({ name: 'New Team' })).rejects.toMatchObject({
      code: ErrorCode.Conflict,
      message: 'Team with this name already exists',
    })
  })
})

describe('updateTeam', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockExistingTeam: Team
  let mockUpdatedTeam: Team
  let mockTeamRepoFindById: any
  let mockTeamRepoFindByName: any
  let mockTeamRepoUpdate: any

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
    mockTeamRepoFindByName = mock(async () => undefined)
    mockTeamRepoUpdate = mock(async () => mockUpdatedTeam)

    await moduleMocker.mock('@/data', () => ({
      teamRepo: {
        findById: mockTeamRepoFindById,
        findByName: mockTeamRepoFindByName,
        update: mockTeamRepoUpdate,
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

  it('should check name uniqueness when name is being changed', async () => {
    await updateTeam(TEAM_1, { name: 'Updated Team' })

    expect(mockTeamRepoFindByName).toHaveBeenCalledWith('Updated Team')
  })

  it('should not check name uniqueness when name is unchanged', async () => {
    await updateTeam(TEAM_1, { name: 'Old Team' })

    expect(mockTeamRepoFindByName).not.toHaveBeenCalled()
  })

  it('should throw Conflict error when new name already exists', async () => {
    const otherTeam: Team = { ...mockExistingTeam, id: TEAM_2, name: 'Taken Name' }
    mockTeamRepoFindByName.mockImplementation(async () => otherTeam)

    expect(updateTeam(TEAM_1, { name: 'Taken Name' })).rejects.toThrow(AppError)
    expect(updateTeam(TEAM_1, { name: 'Taken Name' })).rejects.toMatchObject({
      code: ErrorCode.Conflict,
      message: 'Team with this name already exists',
    })
  })
})
