import { z } from 'zod'

import type { ValidatedParamCtx, ValidatedQueryCtx } from '../../@shared'

import { requestValidationRules as rules } from '../../@shared'

export const adminsSearchSchema = z.object({
  search: rules.userFilter.search.optional(),
  statuses: rules.userFilter.statuses.optional(),
  ...rules.pagination,
})

export type AdminsSearchQuery = z.infer<typeof adminsSearchSchema>
export type AdminsSearchCtx = ValidatedQueryCtx<AdminsSearchQuery>

export const adminIdSchema = z.object({
  id: rules.data.id,
})

export type AdminIdParam = z.infer<typeof adminIdSchema>
export type AdminDetailCtx = ValidatedParamCtx<AdminIdParam>
