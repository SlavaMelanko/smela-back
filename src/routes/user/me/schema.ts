import { z } from 'zod'

import type { ValidatedJsonCtx } from '@/routes/validated-ctx'

import { rules } from '@/routes/rules'

export const updateProfileSchema = z.object({
  firstName: rules.user.firstName.optional(),
  lastName: rules.user.lastName.optional(),
}).strict()

export type UpdateProfileBody = z.infer<typeof updateProfileSchema>
export type UpdateProfileCtx = ValidatedJsonCtx<UpdateProfileBody>

export const changePasswordSchema = z.object({
  currentPassword: rules.user.password,
  newPassword: rules.user.password,
}).strict()

export type ChangePasswordBody = z.infer<typeof changePasswordSchema>
export type ChangePasswordCtx = ValidatedJsonCtx<ChangePasswordBody>
