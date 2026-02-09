import { z } from 'zod'

import type { ValidatedParamCtx, ValidatedQueryCtx } from '../../@shared'

import { requestValidationRules as rules } from '../../@shared'

export const getAdminsQuerySchema = z.object({
  search: rules.userFilter.search.optional(),
  statuses: rules.userFilter.statuses.optional(),
  ...rules.pagination,
})

export type GetAdminsQuery = z.infer<typeof getAdminsQuerySchema>
export type GetAdminsCtx = ValidatedQueryCtx<GetAdminsQuery>

export const getAdminParamsSchema = z.object({
  adminId: rules.data.id,
})

export type GetAdminParams = z.infer<typeof getAdminParamsSchema>
export type GetAdminCtx = ValidatedParamCtx<GetAdminParams>
