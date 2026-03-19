import { z } from 'zod'

import type { ValidatedJsonCtx, ValidatedQueryCtx } from '@/routes/validated-ctx'

import { requestValidationRules as rules } from '../../@shared'
import { permissionsSchema } from '../../@shared/permissions-schema'

export const getAdminsQuerySchema = z.object({
  search: rules.userFilter.search.optional(),
  statuses: rules.userFilter.statuses.optional(),
  ...rules.pagination,
})

export type GetAdminsQuery = z.infer<typeof getAdminsQuerySchema>
export type GetAdminsCtx = ValidatedQueryCtx<GetAdminsQuery>

export const createAdminBodySchema = z.object({
  firstName: rules.data.firstName,
  lastName: rules.data.lastName.optional(),
  email: rules.data.email,
  permissions: permissionsSchema,
})

export type CreateAdminBody = z.infer<typeof createAdminBodySchema>
export type CreateAdminCtx = ValidatedJsonCtx<CreateAdminBody>
