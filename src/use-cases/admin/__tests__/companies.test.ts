import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import type { Company, CompanySearchResult, CompanyWithMembers } from '@/data'

import { ModuleMocker, testUuids } from '@/__tests__'
import AppError from '@/errors/app-error'
import ErrorCode from '@/errors/codes'

import {
  createCompany,
  deleteCompany,
  getCompanies,
  getCompany,
  updateCompany,
} from '../companies'

const { COMPANY_1, COMPANY_2 } = testUuids

describe('getCompanies', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  const DEFAULT_PAGINATION = { page: 1, limit: 25 }

  let mockSearchResult: CompanySearchResult
  let mockCompanyRepoSearch: any

  beforeEach(async () => {
    mockSearchResult = {
      companies: [
        {
          id: COMPANY_1,
          name: 'Acme Corp',
          website: 'https://acme.com',
          description: 'A test company',
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
    await getCompanies({ search: 'acme' }, DEFAULT_PAGINATION)

    expect(mockCompanyRepoSearch).toHaveBeenCalledWith(
      { search: 'acme' },
      DEFAULT_PAGINATION,
    )
  })

  it('should return companies and pagination', async () => {
    const result = await getCompanies({}, DEFAULT_PAGINATION)

    expect(result).toEqual(mockSearchResult)
  })
})

describe('getCompany', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockCompany: CompanyWithMembers
  let mockCompanyRepoFind: any

  beforeEach(async () => {
    mockCompany = {
      id: COMPANY_1,
      name: 'Acme Corp',
      website: 'https://acme.com',
      description: 'A test company',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      members: [],
    }

    mockCompanyRepoFind = mock(async () => mockCompany)

    await moduleMocker.mock('@/data', () => ({
      companyRepo: { find: mockCompanyRepoFind },
    }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should return company when found', async () => {
    const result = await getCompany(COMPANY_1)

    expect(mockCompanyRepoFind).toHaveBeenCalledWith(COMPANY_1)
    expect(result).toEqual({ company: mockCompany })
  })

  it('should throw NotFound error when company does not exist', async () => {
    mockCompanyRepoFind.mockImplementation(async () => undefined)

    expect(getCompany(testUuids.NON_EXISTENT)).rejects.toThrow(AppError)
    expect(getCompany(testUuids.NON_EXISTENT)).rejects.toMatchObject({
      code: ErrorCode.NotFound,
      message: 'Company not found',
    })
  })
})

describe('createCompany', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockCompany: Company
  let mockCompanyRepoFindByName: any
  let mockCompanyRepoCreate: any

  beforeEach(async () => {
    mockCompany = {
      id: COMPANY_1,
      name: 'New Company',
      website: 'https://newcompany.com',
      description: 'A new company',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    }

    mockCompanyRepoFindByName = mock(async () => undefined)
    mockCompanyRepoCreate = mock(async () => mockCompany)

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

  it('should create company when name is unique', async () => {
    const params = { name: 'New Company', website: 'https://newcompany.com' }

    const result = await createCompany(params)

    expect(mockCompanyRepoFindByName).toHaveBeenCalledWith('New Company')
    expect(mockCompanyRepoCreate).toHaveBeenCalledWith(params)
    expect(result).toEqual({ company: mockCompany })
  })

  it('should throw Conflict error when company name already exists', async () => {
    mockCompanyRepoFindByName.mockImplementation(async () => mockCompany)

    expect(createCompany({ name: 'New Company' })).rejects.toThrow(AppError)
    expect(createCompany({ name: 'New Company' })).rejects.toMatchObject({
      code: ErrorCode.Conflict,
      message: 'Company with this name already exists',
    })
  })
})

describe('updateCompany', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockExistingCompany: Company
  let mockUpdatedCompany: Company
  let mockCompanyRepoFindById: any
  let mockCompanyRepoFindByName: any
  let mockCompanyRepoUpdate: any

  beforeEach(async () => {
    mockExistingCompany = {
      id: COMPANY_1,
      name: 'Old Company',
      website: 'https://oldcompany.com',
      description: 'An old company',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    }

    mockUpdatedCompany = {
      ...mockExistingCompany,
      name: 'Updated Company',
      updatedAt: new Date('2024-01-02'),
    }

    mockCompanyRepoFindById = mock(async () => mockExistingCompany)
    mockCompanyRepoFindByName = mock(async () => undefined)
    mockCompanyRepoUpdate = mock(async () => mockUpdatedCompany)

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

  it('should update company when it exists', async () => {
    const params = { name: 'Updated Company' }

    const result = await updateCompany(COMPANY_1, params)

    expect(mockCompanyRepoFindById).toHaveBeenCalledWith(COMPANY_1)
    expect(mockCompanyRepoUpdate).toHaveBeenCalledWith(COMPANY_1, params)
    expect(result).toEqual({ company: mockUpdatedCompany })
  })

  it('should throw NotFound error when company does not exist', async () => {
    mockCompanyRepoFindById.mockImplementation(async () => undefined)

    expect(updateCompany(testUuids.NON_EXISTENT, { name: 'Test' })).rejects.toThrow(AppError)
    expect(updateCompany(testUuids.NON_EXISTENT, { name: 'Test' })).rejects.toMatchObject({
      code: ErrorCode.NotFound,
      message: 'Company not found',
    })
  })

  it('should check name uniqueness when name is being changed', async () => {
    await updateCompany(COMPANY_1, { name: 'Updated Company' })

    expect(mockCompanyRepoFindByName).toHaveBeenCalledWith('Updated Company')
  })

  it('should not check name uniqueness when name is unchanged', async () => {
    await updateCompany(COMPANY_1, { name: 'Old Company' })

    expect(mockCompanyRepoFindByName).not.toHaveBeenCalled()
  })

  it('should throw Conflict error when new name already exists', async () => {
    const otherCompany: Company = { ...mockExistingCompany, id: COMPANY_2, name: 'Taken Name' }
    mockCompanyRepoFindByName.mockImplementation(async () => otherCompany)

    expect(updateCompany(COMPANY_1, { name: 'Taken Name' })).rejects.toThrow(AppError)
    expect(updateCompany(COMPANY_1, { name: 'Taken Name' })).rejects.toMatchObject({
      code: ErrorCode.Conflict,
      message: 'Company with this name already exists',
    })
  })
})

describe('deleteCompany', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockCompany: Company
  let mockCompanyRepoFindById: any
  let mockCompanyRepoDelete: any

  beforeEach(async () => {
    mockCompany = {
      id: COMPANY_1,
      name: 'Company to Delete',
      website: null,
      description: null,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    }

    mockCompanyRepoFindById = mock(async () => mockCompany)
    mockCompanyRepoDelete = mock(async () => undefined)

    await moduleMocker.mock('@/data', () => ({
      companyRepo: {
        findById: mockCompanyRepoFindById,
        delete: mockCompanyRepoDelete,
      },
    }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should delete company when it exists', async () => {
    await deleteCompany(COMPANY_1)

    expect(mockCompanyRepoFindById).toHaveBeenCalledWith(COMPANY_1)
    expect(mockCompanyRepoDelete).toHaveBeenCalledWith(COMPANY_1)
  })

  it('should throw NotFound error when company does not exist', async () => {
    mockCompanyRepoFindById.mockImplementation(async () => undefined)

    expect(deleteCompany(testUuids.NON_EXISTENT)).rejects.toThrow(AppError)
    expect(deleteCompany(testUuids.NON_EXISTENT)).rejects.toMatchObject({
      code: ErrorCode.NotFound,
      message: 'Company not found',
    })
  })
})
