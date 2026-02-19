import { z } from 'zod'

import type { ValidatedJsonCtx, ValidatedParamCtx, ValidatedQueryCtx } from '../../@shared'

import { requestValidationRules as rules } from '../../@shared'
import { permissionsSchema } from '../../@shared/permissions-schema'

export const getAdminsQuerySchema = z.object({
  search: rules.userFilter.search.optional(),
  statuses: rules.userFilter.statuses.optional(),
  ...rules.pagination,
})

export type GetAdminsQuery = z.infer<typeof getAdminsQuerySchema>
export type GetAdminsCtx = ValidatedQueryCtx<GetAdminsQuery>

export const createAdminBodySchema = z.object({
  firstName: rules.data.firstName,
  lastName: rules.data.lastName.optional(),
  email: rules.data.email,
  permissions: permissionsSchema,
})

export type CreateAdminBody = z.infer<typeof createAdminBodySchema>
export type CreateAdminCtx = ValidatedJsonCtx<CreateAdminBody>

export const getAdminParamsSchema = z.object({
  adminId: rules.data.id,
})

export type GetAdminParams = z.infer<typeof getAdminParamsSchema>
export type GetAdminCtx = ValidatedParamCtx<GetAdminParams>

export const resendAdminInviteParamsSchema = z.object({
  adminId: rules.data.id,
})

export type ResendAdminInviteParams = z.infer<typeof resendAdminInviteParamsSchema>
export type ResendAdminInviteCtx = ValidatedParamCtx<ResendAdminInviteParams>

export const cancelAdminInviteParamsSchema = z.object({
  adminId: rules.data.id,
})

export type CancelAdminInviteParams = z.infer<typeof cancelAdminInviteParamsSchema>
export type CancelAdminInviteCtx = ValidatedParamCtx<CancelAdminInviteParams>
