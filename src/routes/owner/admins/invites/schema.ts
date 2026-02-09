import { z } from 'zod'

import type { ValidatedJsonCtx, ValidatedParamCtx } from '../../../@shared'

import { requestValidationRules as rules } from '../../../@shared'

export const inviteAdminBodySchema = z.object({
  firstName: rules.data.firstName,
  lastName: rules.data.lastName.optional(),
  email: rules.data.email,
  permissions: z.object({
    view: z.boolean(),
    edit: z.boolean(),
    create: z.boolean(),
    delete: z.boolean(),
  }),
})

export type InviteAdminBody = z.infer<typeof inviteAdminBodySchema>
export type InviteAdminCtx = ValidatedJsonCtx<InviteAdminBody>

export const resendAdminInviteParamsSchema = z.object({
  adminId: rules.data.id,
})

export type ResendAdminInviteParams = z.infer<typeof resendAdminInviteParamsSchema>
export type ResendAdminInviteCtx = ValidatedParamCtx<ResendAdminInviteParams>
