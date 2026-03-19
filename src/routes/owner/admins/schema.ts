import { z } from 'zod'

import type { ValidatedJsonCtx, ValidatedQueryCtx } from '@/routes/validated-ctx'

import { rules } from '@/routes/rules'

export const getAdminsQuerySchema = z.object({
  search: rules.userFilter.search.optional(),
  statuses: rules.userFilter.statuses.optional(),
  ...rules.pagination,
})

export type GetAdminsQuery = z.infer<typeof getAdminsQuerySchema>
export type GetAdminsCtx = ValidatedQueryCtx<GetAdminsQuery>

export const createAdminBodySchema = z.object({
  firstName: rules.user.firstName,
  lastName: rules.user.lastName.optional(),
  email: rules.user.email,
  permissions: rules.permissions,
}).strict()

export type CreateAdminBody = z.infer<typeof createAdminBodySchema>
export type CreateAdminCtx = ValidatedJsonCtx<CreateAdminBody>
