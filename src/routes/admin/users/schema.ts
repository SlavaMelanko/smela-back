import { z } from 'zod'

import { USER_ROLES } from '@/types'

import type { ValidatedParamCtx, ValidatedQueryCtx } from '../../@shared'

import { requestValidationRules as rules } from '../../@shared'

export const getUsersQuerySchema = z.object({
  search: rules.userFilter.search.optional(),
  roles: rules.userFilter.roles.default(USER_ROLES.join(',')),
  statuses: rules.userFilter.statuses.optional(),
  ...rules.pagination,
})

export type GetUsersQuery = z.infer<typeof getUsersQuerySchema>
export type GetUsersCtx = ValidatedQueryCtx<GetUsersQuery>

export const getUserParamsSchema = z.object({
  id: rules.data.id,
})

export type GetUserParams = z.infer<typeof getUserParamsSchema>
export type GetUserCtx = ValidatedParamCtx<GetUserParams>
