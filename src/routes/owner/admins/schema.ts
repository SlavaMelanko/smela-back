import { z } from 'zod'

import { Status } from '@/types'

import type { ValidatedParamCtx, ValidatedQueryCtx } from '../../@shared'

const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 25
const MAX_LIMIT = 100

export const adminsSearchSchema = z.object({
  search: z.string().trim().optional(),
  statuses: z
    .string()
    .transform(val => val.split(','))
    .pipe(z.array(z.nativeEnum(Status)))
    .optional(),
  page: z.coerce.number().int().min(1).default(DEFAULT_PAGE),
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
})

export type AdminsSearchQuery = z.infer<typeof adminsSearchSchema>
export type AdminsSearchCtx = ValidatedQueryCtx<AdminsSearchQuery>

export const adminIdSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export type AdminIdParam = z.infer<typeof adminIdSchema>
export type AdminDetailCtx = ValidatedParamCtx<AdminIdParam>
