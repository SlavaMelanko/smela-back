import { z } from 'zod'

import { USER_ROLES } from '@/types'

import type { ValidatedParamCtx, ValidatedQueryCtx } from '../../@shared'

import { requestValidationRules as rules } from '../../@shared'

export const usersSearchSchema = z.object({
  search: rules.userFilter.search.optional(),
  roles: rules.userFilter.roles.default(USER_ROLES.join(',')),
  statuses: rules.userFilter.statuses.optional(),
  ...rules.pagination,
})

export type UsersSearchQuery = z.infer<typeof usersSearchSchema>
export type UsersSearchCtx = ValidatedQueryCtx<UsersSearchQuery>

export const userIdSchema = z.object({
  id: rules.data.id,
})

export type UserIdParam = z.infer<typeof userIdSchema>
export type UserDetailCtx = ValidatedParamCtx<UserIdParam>
