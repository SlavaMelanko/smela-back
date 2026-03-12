import { z } from 'zod'

import type { ValidatedParamCtx, ValidatedParamJsonCtx } from '@/routes/@shared'

import { requestValidationRules as rules } from '@/routes/@shared'

export const userIdParamsSchema = z.object({
  userId: rules.data.id,
})

export type UserIdParams = z.infer<typeof userIdParamsSchema>
export type UserIdCtx = ValidatedParamCtx<UserIdParams>

export const updateUserBodySchema = z.object({
  firstName: rules.data.firstName.optional(),
  lastName: rules.data.lastName.optional(),
}).strict()

export type UpdateUserBody = z.infer<typeof updateUserBodySchema>
export type UpdateUserCtx = ValidatedParamJsonCtx<UserIdParams, UpdateUserBody>
