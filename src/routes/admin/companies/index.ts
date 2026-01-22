import { Hono } from 'hono'

import type { AppContext } from '@/context'

import { requestValidator } from '@/middleware'

import {
  createCompanyHandler,
  deleteCompanyHandler,
  getCompaniesHandler,
  getCompanyHandler,
  updateCompanyHandler,
} from './handler'
import {
  companyParamsSchema,
  createCompanyBodySchema,
  getCompaniesQuerySchema,
  updateCompanyBodySchema,
} from './schema'

const adminCompaniesRoute = new Hono<AppContext>()

adminCompaniesRoute.get(
  '/companies',
  requestValidator('query', getCompaniesQuerySchema),
  getCompaniesHandler,
)

adminCompaniesRoute.get(
  '/companies/:id',
  requestValidator('param', companyParamsSchema),
  getCompanyHandler,
)

adminCompaniesRoute.post(
  '/companies',
  requestValidator('json', createCompanyBodySchema),
  createCompanyHandler,
)

adminCompaniesRoute.patch(
  '/companies/:id',
  requestValidator('param', companyParamsSchema),
  requestValidator('json', updateCompanyBodySchema),
  updateCompanyHandler,
)

adminCompaniesRoute.delete(
  '/companies/:id',
  requestValidator('param', companyParamsSchema),
  deleteCompanyHandler,
)

export default adminCompaniesRoute
