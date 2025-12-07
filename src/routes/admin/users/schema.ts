import { z } from 'zod'

import { Role, Status } from '@/types'

import type { ValidatedParamCtx, ValidatedQueryCtx } from '../../@shared'

const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 25
const MAX_LIMIT = 100

const DEFAULT_ROLES = [Role.User, Role.Enterprise]

export const usersSearchSchema = z.object({
  roles: z
    .string()
    .transform(val => val.split(','))
    .pipe(z.array(z.nativeEnum(Role)))
    .default(DEFAULT_ROLES.join(',')),
  statuses: z
    .string()
    .transform(val => val.split(','))
    .pipe(z.array(z.nativeEnum(Status)))
    .optional(),
  page: z.coerce.number().int().min(1).default(DEFAULT_PAGE),
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
})

export type UsersSearchQuery = z.infer<typeof usersSearchSchema>
export type UsersSearchCtx = ValidatedQueryCtx<UsersSearchQuery>

export const userIdSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export type UserIdParam = z.infer<typeof userIdSchema>
export type UserDetailCtx = ValidatedParamCtx<UserIdParam>
