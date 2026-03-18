import { z } from 'zod'

import type { ValidatedJsonCtx } from '../../@shared'

import { requestValidationRules as rules } from '../../@shared'

export const updateProfileSchema = z.object({
  firstName: rules.data.firstName.optional(),
  lastName: rules.data.lastName.optional(),
}).strict()

export type UpdateProfileBody = z.infer<typeof updateProfileSchema>
export type UpdateProfileCtx = ValidatedJsonCtx<UpdateProfileBody>

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: rules.data.password,
}).strict()

export type ChangePasswordBody = z.infer<typeof changePasswordSchema>
export type ChangePasswordCtx = ValidatedJsonCtx<ChangePasswordBody>
