import { z } from 'zod'

import { permissionsSchema } from '@/routes/@shared/permissions-schema'

import type { ValidatedParamCtx, ValidatedParamJsonCtx } from '../../../../@shared'

import { requestValidationRules as rules } from '../../../../@shared'

const adminIdParamsSchema = z.object({
  adminId: rules.data.id,
})

export type GetAdminPermissionsParams = z.infer<typeof adminIdParamsSchema>
export type GetAdminPermissionsCtx = ValidatedParamCtx<GetAdminPermissionsParams>

export const updateAdminPermissionsBodySchema = permissionsSchema

export type UpdateAdminPermissionsParams = z.infer<typeof adminIdParamsSchema>
export type UpdateAdminPermissionsBody = z.infer<typeof updateAdminPermissionsBodySchema>
export type UpdateAdminPermissionsCtx = ValidatedParamJsonCtx<
  UpdateAdminPermissionsParams,
  UpdateAdminPermissionsBody
>

export { adminIdParamsSchema }
