import { z } from 'zod'

import type { ValidatedJsonCtx, ValidatedParamCtx, ValidatedQueryCtx } from '../../@shared'

import { requestValidationRules as rules } from '../../@shared'

export const getAdminsQuerySchema = z.object({
  search: rules.userFilter.search.optional(),
  statuses: rules.userFilter.statuses.optional(),
  ...rules.pagination,
})

export type GetAdminsQuery = z.infer<typeof getAdminsQuerySchema>
export type GetAdminsCtx = ValidatedQueryCtx<GetAdminsQuery>

export const getAdminParamsSchema = z.object({
  id: rules.data.id,
})

export type GetAdminParams = z.infer<typeof getAdminParamsSchema>
export type GetAdminCtx = ValidatedParamCtx<GetAdminParams>

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

export const resendAdminInvitationParamsSchema = getAdminParamsSchema

export type ResendAdminInvitationParams = GetAdminParams
export type ResendAdminInvitationCtx = ValidatedParamCtx<ResendAdminInvitationParams>
