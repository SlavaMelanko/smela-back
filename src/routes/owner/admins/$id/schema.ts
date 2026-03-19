import { z } from 'zod'

import type { ValidatedParamCtx, ValidatedParamJsonCtx } from '@/routes/validated-ctx'

import { Status } from '@/types'

import { requestValidationRules as rules } from '../../../@shared'

export const adminIdParamsSchema = z.object({
  adminId: rules.data.id,
})

export type GetAdminParams = z.infer<typeof adminIdParamsSchema>
export type GetAdminCtx = ValidatedParamCtx<GetAdminParams>

export const updateAdminBodySchema = z.object({
  firstName: rules.data.firstName.optional(),
  lastName: rules.data.lastName.optional(),
  status: z.enum(Status).optional(),
}).strict()

export type UpdateAdminParams = z.infer<typeof adminIdParamsSchema>
export type UpdateAdminBody = z.infer<typeof updateAdminBodySchema>
export type UpdateAdminCtx = ValidatedParamJsonCtx<UpdateAdminParams, UpdateAdminBody>

export type ResendAdminInviteParams = z.infer<typeof adminIdParamsSchema>
export type ResendAdminInviteCtx = ValidatedParamCtx<ResendAdminInviteParams>

export type CancelAdminInviteParams = z.infer<typeof adminIdParamsSchema>
export type CancelAdminInviteCtx = ValidatedParamCtx<CancelAdminInviteParams>
