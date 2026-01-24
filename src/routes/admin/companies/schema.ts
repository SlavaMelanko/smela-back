import { z } from 'zod'

import type { ValidatedJsonCtx, ValidatedParamCtx, ValidatedParamJsonCtx, ValidatedQueryCtx } from '../../@shared'

import { requestValidationRules as rules } from '../../@shared'

export const getCompaniesQuerySchema = z.object({
  search: rules.company.search.optional(),
  ...rules.pagination,
})

export type GetCompaniesQuery = z.infer<typeof getCompaniesQuerySchema>
export type GetCompaniesCtx = ValidatedQueryCtx<GetCompaniesQuery>

// Used by GET and DELETE endpoints, so no 'Get' prefix
export const companyParamsSchema = z.object({
  id: rules.data.id,
})

export type CompanyParams = z.infer<typeof companyParamsSchema>
export type CompanyParamsCtx = ValidatedParamCtx<CompanyParams>

export const createCompanyBodySchema = z.object({
  name: rules.company.name,
  website: rules.company.website.optional(),
  description: rules.company.description.optional(),
})

export type CreateCompanyBody = z.infer<typeof createCompanyBodySchema>
export type CreateCompanyCtx = ValidatedJsonCtx<CreateCompanyBody>

export const updateCompanyBodySchema = z.object({
  name: rules.company.name.optional(),
  website: rules.company.website.nullish(),
  description: rules.company.description.nullish(),
})

export type UpdateCompanyBody = z.infer<typeof updateCompanyBodySchema>
export type UpdateCompanyCtx = ValidatedParamJsonCtx<CompanyParams, UpdateCompanyBody>
