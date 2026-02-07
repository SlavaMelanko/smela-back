import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import type { Company, CompanySearchResult, CompanyWithMembers } from '@/data'

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

  let mockSearchResult: CompanySearchResult
  let mockCompanyRepoSearch: any

  beforeEach(async () => {
    mockSearchResult = {
      companies: [
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

    mockCompanyRepoSearch = mock(async () => mockSearchResult)

    await moduleMocker.mock('@/data', () => ({
      companyRepo: { search: mockCompanyRepoSearch },
    }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should call companyRepo.search with correct params', async () => {
    await getTeams({ search: 'acme' }, DEFAULT_PAGINATION)

    expect(mockCompanyRepoSearch).toHaveBeenCalledWith(
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

  let mockTeam: CompanyWithMembers
  let mockCompanyRepoFind: any

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

    mockCompanyRepoFind = mock(async () => mockTeam)

    await moduleMocker.mock('@/data', () => ({
      companyRepo: { find: mockCompanyRepoFind },
    }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should return team when found', async () => {
    const result = await getTeam(TEAM_1)

    expect(mockCompanyRepoFind).toHaveBeenCalledWith(TEAM_1)
    expect(result).toEqual({ team: mockTeam })
  })

  it('should throw NotFound error when team does not exist', async () => {
    mockCompanyRepoFind.mockImplementation(async () => undefined)

    expect(getTeam(testUuids.NON_EXISTENT)).rejects.toThrow(AppError)
    expect(getTeam(testUuids.NON_EXISTENT)).rejects.toMatchObject({
      code: ErrorCode.NotFound,
      message: 'Team not found',
    })
  })
})

describe('createTeam', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockTeam: Company
  let mockCompanyRepoFindByName: any
  let mockCompanyRepoCreate: any

  beforeEach(async () => {
    mockTeam = {
      id: TEAM_1,
      name: 'New Team',
      website: 'https://newteam.com',
      description: 'A new team',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    }

    mockCompanyRepoFindByName = mock(async () => undefined)
    mockCompanyRepoCreate = mock(async () => mockTeam)

    await moduleMocker.mock('@/data', () => ({
      companyRepo: {
        findByName: mockCompanyRepoFindByName,
        create: mockCompanyRepoCreate,
      },
    }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should create team when name is unique', async () => {
    const params = { name: 'New Team', website: 'https://newteam.com' }

    const result = await createTeam(params)

    expect(mockCompanyRepoFindByName).toHaveBeenCalledWith('New Team')
    expect(mockCompanyRepoCreate).toHaveBeenCalledWith(params)
    expect(result).toEqual({ team: mockTeam })
  })

  it('should throw Conflict error when team name already exists', async () => {
    mockCompanyRepoFindByName.mockImplementation(async () => mockTeam)

    expect(createTeam({ name: 'New Team' })).rejects.toThrow(AppError)
    expect(createTeam({ name: 'New Team' })).rejects.toMatchObject({
      code: ErrorCode.Conflict,
      message: 'Team with this name already exists',
    })
  })
})

describe('updateTeam', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockExistingTeam: Company
  let mockUpdatedTeam: Company
  let mockCompanyRepoFindById: any
  let mockCompanyRepoFindByName: any
  let mockCompanyRepoUpdate: any

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

    mockCompanyRepoFindById = mock(async () => mockExistingTeam)
    mockCompanyRepoFindByName = mock(async () => undefined)
    mockCompanyRepoUpdate = mock(async () => mockUpdatedTeam)

    await moduleMocker.mock('@/data', () => ({
      companyRepo: {
        findById: mockCompanyRepoFindById,
        findByName: mockCompanyRepoFindByName,
        update: mockCompanyRepoUpdate,
      },
    }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should update team when it exists', async () => {
    const params = { name: 'Updated Team' }

    const result = await updateTeam(TEAM_1, params)

    expect(mockCompanyRepoFindById).toHaveBeenCalledWith(TEAM_1)
    expect(mockCompanyRepoUpdate).toHaveBeenCalledWith(TEAM_1, params)
    expect(result).toEqual({ team: mockUpdatedTeam })
  })

  it('should throw NotFound error when team does not exist', async () => {
    mockCompanyRepoFindById.mockImplementation(async () => undefined)

    expect(updateTeam(testUuids.NON_EXISTENT, { name: 'Test' })).rejects.toThrow(AppError)
    expect(updateTeam(testUuids.NON_EXISTENT, { name: 'Test' })).rejects.toMatchObject({
      code: ErrorCode.NotFound,
      message: 'Team not found',
    })
  })

  it('should check name uniqueness when name is being changed', async () => {
    await updateTeam(TEAM_1, { name: 'Updated Team' })

    expect(mockCompanyRepoFindByName).toHaveBeenCalledWith('Updated Team')
  })

  it('should not check name uniqueness when name is unchanged', async () => {
    await updateTeam(TEAM_1, { name: 'Old Team' })

    expect(mockCompanyRepoFindByName).not.toHaveBeenCalled()
  })

  it('should throw Conflict error when new name already exists', async () => {
    const otherTeam: Company = { ...mockExistingTeam, id: TEAM_2, name: 'Taken Name' }
    mockCompanyRepoFindByName.mockImplementation(async () => otherTeam)

    expect(updateTeam(TEAM_1, { name: 'Taken Name' })).rejects.toThrow(AppError)
    expect(updateTeam(TEAM_1, { name: 'Taken Name' })).rejects.toMatchObject({
      code: ErrorCode.Conflict,
      message: 'Team with this name already exists',
    })
  })
})
