import { z } from 'zod'

import type { ValidatedParamCtx, ValidatedParamJsonCtx } from '@/routes/validated-ctx'

import { rules } from '@/routes/rules'

export const userIdParamsSchema = z.object({
  id: rules.user.id,
})

export type UserIdParams = z.infer<typeof userIdParamsSchema>
export type UserIdCtx = ValidatedParamCtx<UserIdParams>

export const updateUserBodySchema = z.object({
  firstName: rules.user.firstName.optional(),
  lastName: rules.user.lastName.optional(),
  status: rules.user.status.optional(),
}).strict()

export type UpdateUserBody = z.infer<typeof updateUserBodySchema>
export type UpdateUserCtx = ValidatedParamJsonCtx<UserIdParams, UpdateUserBody>
