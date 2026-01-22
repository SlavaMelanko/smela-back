import { HttpStatus } from '@/net/http'
import {
  createCompany,
  deleteCompany,
  getCompany,
  searchCompanies,
  updateCompany,
} from '@/use-cases/admin'

import type {
  CompanyParamsCtx,
  CreateCompanyCtx,
  GetCompaniesCtx,
  UpdateCompanyCtx,
} from './schema'

export const getCompaniesHandler = async (c: GetCompaniesCtx) => {
  const { search, page, limit } = c.req.valid('query')

  const result = await searchCompanies({ search }, { page, limit })

  return c.json(result, HttpStatus.OK)
}

export const getCompanyHandler = async (c: CompanyParamsCtx) => {
  const { id } = c.req.valid('param')

  const result = await getCompany(id)

  return c.json(result.data, HttpStatus.OK)
}

export const createCompanyHandler = async (c: CreateCompanyCtx) => {
  const body = c.req.valid('json')

  const result = await createCompany(body)

  return c.json(result.data, HttpStatus.CREATED)
}

export const updateCompanyHandler = async (c: UpdateCompanyCtx) => {
  const { id } = c.req.valid('param')
  const body = c.req.valid('json')

  const result = await updateCompany(id, body)

  return c.json(result.data, HttpStatus.OK)
}

export const deleteCompanyHandler = async (c: CompanyParamsCtx) => {
  const { id } = c.req.valid('param')

  await deleteCompany(id)

  return c.body(null, HttpStatus.NO_CONTENT)
}
