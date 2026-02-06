import { Hono } from 'hono'

import type { AppContext } from '@/context'

import { requestValidator } from '@/middleware'

import {
  createCompanyHandler,
  createInvitationHandler,
  getCompaniesHandler,
  getCompanyHandler,
  resendInvitationHandler,
  updateCompanyHandler,
} from './handler'
import {
  companyParamsSchema,
  createCompanyBodySchema,
  createInvitationBodySchema,
  createInvitationParamsSchema,
  getCompaniesQuerySchema,
  resendInvitationParamsSchema,
  updateCompanyBodySchema,
} from './schema'

const adminCompaniesRoute = new Hono<AppContext>()

adminCompaniesRoute.get(
  '/companies',
  requestValidator('query', getCompaniesQuerySchema),
  getCompaniesHandler,
)
adminCompaniesRoute.get(
  '/companies/:companyId',
  requestValidator('param', companyParamsSchema),
  getCompanyHandler,
)
adminCompaniesRoute.post(
  '/companies',
  requestValidator('json', createCompanyBodySchema),
  createCompanyHandler,
)
adminCompaniesRoute.patch(
  '/companies/:companyId',
  requestValidator('param', companyParamsSchema),
  requestValidator('json', updateCompanyBodySchema),
  updateCompanyHandler,
)
adminCompaniesRoute.post(
  '/companies/:companyId/invitations',
  requestValidator('param', createInvitationParamsSchema),
  requestValidator('json', createInvitationBodySchema),
  createInvitationHandler,
)
adminCompaniesRoute.post(
  '/companies/:companyId/invitations/:memberId/resend',
  requestValidator('param', resendInvitationParamsSchema),
  resendInvitationHandler,
)

export default adminCompaniesRoute
