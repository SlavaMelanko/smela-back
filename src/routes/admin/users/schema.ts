import { z } from 'zod'

import type { ValidatedQueryCtx } from '@/routes/validated-ctx'

import { Role } from '@/types'

import { requestValidationRules as rules } from '../../@shared'

export const getUsersQuerySchema = z.object({
  search: rules.userFilter.search.optional(),
  roles: rules.userFilter.roles.default([Role.User]),
  statuses: rules.userFilter.statuses.optional(),
  ...rules.pagination,
})

export type GetUsersQuery = z.infer<typeof getUsersQuerySchema>
export type GetUsersCtx = ValidatedQueryCtx<GetUsersQuery>
