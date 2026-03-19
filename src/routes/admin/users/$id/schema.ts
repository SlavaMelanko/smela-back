import { z } from 'zod'

import type { ValidatedParamCtx, ValidatedParamJsonCtx } from '@/routes/validated-ctx'

import { Status } from '@/types'

import { requestValidationRules as rules } from '../../../@shared'

export const userIdParamsSchema = z.object({
  id: rules.data.id,
})

export type UserIdParams = z.infer<typeof userIdParamsSchema>
export type UserIdCtx = ValidatedParamCtx<UserIdParams>

export const updateUserBodySchema = z.object({
  firstName: rules.data.firstName.optional(),
  lastName: rules.data.lastName.optional(),
  status: z.enum(Status).optional(),
}).strict()

export type UpdateUserBody = z.infer<typeof updateUserBodySchema>
export type UpdateUserCtx = ValidatedParamJsonCtx<UserIdParams, UpdateUserBody>
