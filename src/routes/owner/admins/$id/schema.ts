import { z } from 'zod'

import type { ValidatedParamCtx, ValidatedParamJsonCtx } from '@/routes/validated-ctx'

import { rules } from '@/routes/rules'

export const adminIdParamsSchema = z.object({
  adminId: rules.user.id,
})

export type GetAdminParams = z.infer<typeof adminIdParamsSchema>
export type GetAdminCtx = ValidatedParamCtx<GetAdminParams>

export const updateAdminBodySchema = z.object({
  firstName: rules.user.firstName.optional(),
  lastName: rules.user.lastName.optional(),
  status: rules.user.status.optional(),
}).strict()

export type UpdateAdminParams = z.infer<typeof adminIdParamsSchema>
export type UpdateAdminBody = z.infer<typeof updateAdminBodySchema>
export type UpdateAdminCtx = ValidatedParamJsonCtx<UpdateAdminParams, UpdateAdminBody>

export type ResendAdminInviteParams = z.infer<typeof adminIdParamsSchema>
export type ResendAdminInviteCtx = ValidatedParamCtx<ResendAdminInviteParams>

export type CancelAdminInviteParams = z.infer<typeof adminIdParamsSchema>
export type CancelAdminInviteCtx = ValidatedParamCtx<CancelAdminInviteParams>
