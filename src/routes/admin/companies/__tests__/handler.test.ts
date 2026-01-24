import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import type { Company } from '@/data'

import { ModuleMocker, testUuids } from '@/__tests__'
import { HttpStatus } from '@/net/http'

import {
  createCompanyHandler,
  deleteCompanyHandler,
  getCompaniesHandler,
  getCompanyHandler,
  updateCompanyHandler,
} from '../handler'

const { COMPANY_1 } = testUuids

describe('getCompaniesHandler', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  const DEFAULT_LIMIT = 25

  let mockContext: any
  let mockJson: any
  let mockGetCompanies: any

  const mockCompanies: Company[] = [
    {
      id: COMPANY_1,
      name: 'Acme Corp',
      website: 'https://acme.com',
      description: 'A test company',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
  ]

  beforeEach(async () => {
    mockJson = mock((data: any, status: number) => ({ data, status }))

    mockContext = {
      req: {
        valid: mock(() => ({
          search: undefined,
          page: 1,
          limit: DEFAULT_LIMIT,
        })),
      },
      json: mockJson,
    }

    mockGetCompanies = mock(async () => ({
      companies: mockCompanies,
      pagination: {
        page: 1,
        limit: DEFAULT_LIMIT,
        total: 1,
        totalPages: 1,
      },
    }))

    await moduleMocker.mock('@/use-cases/admin', () => ({
      getCompanies: mockGetCompanies,
    }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should call getCompanies with correct parameters', async () => {
    await getCompaniesHandler(mockContext)

    expect(mockGetCompanies).toHaveBeenCalledWith(
      { search: undefined },
      { page: 1, limit: DEFAULT_LIMIT },
    )
  })

  it('should return companies and pagination with OK status', async () => {
    const result = await getCompaniesHandler(mockContext)

    expect(mockJson).toHaveBeenCalledWith(
      {
        companies: mockCompanies,
        pagination: {
          page: 1,
          limit: DEFAULT_LIMIT,
          total: 1,
          totalPages: 1,
        },
      },
      HttpStatus.OK,
    )
    expect(result.status).toBe(HttpStatus.OK)
  })

  it('should pass search filter when provided', async () => {
    mockContext.req.valid = mock(() => ({
      search: 'acme',
      page: 1,
      limit: DEFAULT_LIMIT,
    }))

    await getCompaniesHandler(mockContext)

    expect(mockGetCompanies).toHaveBeenCalledWith(
      { search: 'acme' },
      { page: 1, limit: DEFAULT_LIMIT },
    )
  })

  it('should propagate error when getCompanies throws', async () => {
    mockGetCompanies.mockImplementation(async () => {
      throw new Error('Database connection failed')
    })

    expect(getCompaniesHandler(mockContext)).rejects.toThrow('Database connection failed')
  })
})

describe('getCompanyHandler', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockContext: any
  let mockJson: any
  let mockGetCompany: any

  const mockCompany: Company = {
    id: COMPANY_1,
    name: 'Acme Corp',
    website: 'https://acme.com',
    description: 'A test company',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  }

  beforeEach(async () => {
    mockJson = mock((data: any, status: number) => ({ data, status }))

    mockContext = {
      req: {
        valid: mock(() => ({ id: COMPANY_1 })),
      },
      json: mockJson,
    }

    mockGetCompany = mock(async () => ({ company: mockCompany }))

    await moduleMocker.mock('@/use-cases/admin', () => ({
      getCompany: mockGetCompany,
    }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should call getCompany with correct id', async () => {
    await getCompanyHandler(mockContext)

    expect(mockGetCompany).toHaveBeenCalledWith(COMPANY_1)
  })

  it('should return company with OK status', async () => {
    const result = await getCompanyHandler(mockContext)

    expect(mockJson).toHaveBeenCalledWith({ company: mockCompany }, HttpStatus.OK)
    expect(result.status).toBe(HttpStatus.OK)
  })

  it('should propagate error when getCompany throws', async () => {
    mockGetCompany.mockImplementation(async () => {
      throw new Error('Company not found')
    })

    expect(getCompanyHandler(mockContext)).rejects.toThrow('Company not found')
  })
})

describe('createCompanyHandler', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockContext: any
  let mockJson: any
  let mockCreateCompany: any

  const mockCompany: Company = {
    id: COMPANY_1,
    name: 'New Company',
    website: 'https://newcompany.com',
    description: 'A new company',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  }

  beforeEach(async () => {
    mockJson = mock((data: any, status: number) => ({ data, status }))

    mockContext = {
      req: {
        valid: mock(() => ({
          name: 'New Company',
          website: 'https://newcompany.com',
          description: 'A new company',
        })),
      },
      json: mockJson,
    }

    mockCreateCompany = mock(async () => ({ company: mockCompany }))

    await moduleMocker.mock('@/use-cases/admin', () => ({
      createCompany: mockCreateCompany,
    }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should call createCompany with correct body', async () => {
    await createCompanyHandler(mockContext)

    expect(mockCreateCompany).toHaveBeenCalledWith({
      name: 'New Company',
      website: 'https://newcompany.com',
      description: 'A new company',
    })
  })

  it('should return created company with CREATED status', async () => {
    const result = await createCompanyHandler(mockContext)

    expect(mockJson).toHaveBeenCalledWith({ company: mockCompany }, HttpStatus.CREATED)
    expect(result.status).toBe(HttpStatus.CREATED)
  })

  it('should propagate error when createCompany throws', async () => {
    mockCreateCompany.mockImplementation(async () => {
      throw new Error('Company with this name already exists')
    })

    expect(createCompanyHandler(mockContext)).rejects.toThrow('Company with this name already exists')
  })
})

describe('updateCompanyHandler', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockContext: any
  let mockJson: any
  let mockUpdateCompany: any

  const mockCompany: Company = {
    id: COMPANY_1,
    name: 'Updated Company',
    website: 'https://updated.com',
    description: 'An updated company',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
  }

  beforeEach(async () => {
    mockJson = mock((data: any, status: number) => ({ data, status }))

    mockContext = {
      req: {
        valid: mock((type: string) => {
          if (type === 'param') {
            return { id: COMPANY_1 }
          }

          return { name: 'Updated Company' }
        }),
      },
      json: mockJson,
    }

    mockUpdateCompany = mock(async () => ({ company: mockCompany }))

    await moduleMocker.mock('@/use-cases/admin', () => ({
      updateCompany: mockUpdateCompany,
    }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should call updateCompany with correct id and body', async () => {
    await updateCompanyHandler(mockContext)

    expect(mockUpdateCompany).toHaveBeenCalledWith(COMPANY_1, { name: 'Updated Company' })
  })

  it('should return updated company with OK status', async () => {
    const result = await updateCompanyHandler(mockContext)

    expect(mockJson).toHaveBeenCalledWith({ company: mockCompany }, HttpStatus.OK)
    expect(result.status).toBe(HttpStatus.OK)
  })

  it('should propagate error when updateCompany throws', async () => {
    mockUpdateCompany.mockImplementation(async () => {
      throw new Error('Company not found')
    })

    expect(updateCompanyHandler(mockContext)).rejects.toThrow('Company not found')
  })
})

describe('deleteCompanyHandler', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockContext: any
  let mockBody: any
  let mockDeleteCompany: any

  beforeEach(async () => {
    mockBody = mock((data: any, status: number) => ({ data, status }))

    mockContext = {
      req: {
        valid: mock(() => ({ id: COMPANY_1 })),
      },
      body: mockBody,
    }

    mockDeleteCompany = mock(async () => undefined)

    await moduleMocker.mock('@/use-cases/admin', () => ({
      deleteCompany: mockDeleteCompany,
    }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should call deleteCompany with correct id', async () => {
    await deleteCompanyHandler(mockContext)

    expect(mockDeleteCompany).toHaveBeenCalledWith(COMPANY_1)
  })

  it('should return NO_CONTENT status', async () => {
    const result = await deleteCompanyHandler(mockContext)

    expect(mockBody).toHaveBeenCalledWith(null, HttpStatus.NO_CONTENT)
    expect(result.status).toBe(HttpStatus.NO_CONTENT)
  })

  it('should propagate error when deleteCompany throws', async () => {
    mockDeleteCompany.mockImplementation(async () => {
      throw new Error('Company not found')
    })

    expect(deleteCompanyHandler(mockContext)).rejects.toThrow('Company not found')
  })
})
