import { z } from 'zod'

import { Role, Status } from '@/types'

import type { ValidatedQueryCtx } from '../../@shared'

const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 25
const MAX_LIMIT = 100

const DEFAULT_ROLES = [Role.User, Role.Enterprise]

const listUsersSchema = z.object({
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

export type ListUsersQuery = z.infer<typeof listUsersSchema>

export type ListUsersCtx = ValidatedQueryCtx<ListUsersQuery>

export default listUsersSchema
