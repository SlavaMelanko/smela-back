import type { CompanySearchParams, PaginationParams } from '@/data'

import { companyRepo } from '@/data'
import { AppError, ErrorCode } from '@/errors'

export const searchCompanies = async (
  params: CompanySearchParams,
  pagination: PaginationParams,
) => {
  return companyRepo.findAll(params, pagination)
}

export const getCompany = async (companyId: string) => {
  const company = await companyRepo.findWithMembers(companyId)

  if (!company) {
    throw new AppError(ErrorCode.NotFound, 'Company not found')
  }

  return { data: { company } }
}

export interface CreateCompanyParams {
  name: string
  website?: string
  description?: string
}

export const createCompany = async (params: CreateCompanyParams) => {
  const existing = await companyRepo.findByName(params.name)

  if (existing) {
    throw new AppError(ErrorCode.Conflict, 'Company with this name already exists')
  }

  const company = await companyRepo.create(params)

  return { data: { company } }
}

export interface UpdateCompanyParams {
  name?: string
  website?: string | null
  description?: string | null
}

export const updateCompany = async (companyId: string, params: UpdateCompanyParams) => {
  const existing = await companyRepo.findById(companyId)

  if (!existing) {
    throw new AppError(ErrorCode.NotFound, 'Company not found')
  }

  if (params.name && params.name !== existing.name) {
    const nameConflict = await companyRepo.findByName(params.name)

    if (nameConflict) {
      throw new AppError(ErrorCode.Conflict, 'Company with this name already exists')
    }
  }

  const company = await companyRepo.update(companyId, params)

  return { data: { company } }
}

export const deleteCompany = async (companyId: string) => {
  const existing = await companyRepo.findById(companyId)

  if (!existing) {
    throw new AppError(ErrorCode.NotFound, 'Company not found')
  }

  await companyRepo.delete(companyId)
}
