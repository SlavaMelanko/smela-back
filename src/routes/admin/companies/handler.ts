import { HttpStatus } from '@/net/http'
import {
  createCompany,
  getCompanies,
  getCompany,
  inviteMember,
  updateCompany,
} from '@/use-cases/admin'

import type {
  CompanyParamsCtx,
  CreateCompanyCtx,
  CreateInvitationCtx,
  GetCompaniesCtx,
  UpdateCompanyCtx,
} from './schema'

export const getCompaniesHandler = async (c: GetCompaniesCtx) => {
  const { search, page, limit } = c.req.valid('query')

  const filters = { search }
  const pagination = { page, limit }
  const result = await getCompanies(filters, pagination)

  return c.json(result, HttpStatus.OK)
}

export const getCompanyHandler = async (c: CompanyParamsCtx) => {
  const { id } = c.req.valid('param')

  const result = await getCompany(id)

  return c.json(result, HttpStatus.OK)
}

export const createCompanyHandler = async (c: CreateCompanyCtx) => {
  const body = c.req.valid('json')

  const result = await createCompany(body)

  return c.json(result, HttpStatus.CREATED)
}

export const updateCompanyHandler = async (c: UpdateCompanyCtx) => {
  const { id } = c.req.valid('param')
  const body = c.req.valid('json')

  const result = await updateCompany(id, body)

  return c.json(result, HttpStatus.OK)
}

export const createInvitationHandler = async (c: CreateInvitationCtx) => {
  const { companyId } = c.req.valid('param')
  const body = c.req.valid('json')
  const { id: invitedBy } = c.get('user')

  const result = await inviteMember(companyId, body, invitedBy)

  return c.json(result, HttpStatus.CREATED)
}
