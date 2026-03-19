import { z } from 'zod'

import type { ValidatedParamCtx, ValidatedParamJsonCtx } from '@/routes/validated-ctx'

import { rules } from '@/routes/rules'

export const adminIdParamsSchema = z.object({
  adminId: rules.user.id,
})

export type GetAdminPermissionsParams = z.infer<typeof adminIdParamsSchema>
export type GetAdminPermissionsCtx = ValidatedParamCtx<GetAdminPermissionsParams>

export const updateAdminPermissionsBodySchema = z.object({
  permissions: rules.permissions,
}).strict()

export type UpdateAdminPermissionsParams = z.infer<typeof adminIdParamsSchema>
export type UpdateAdminPermissionsBody = z.infer<typeof updateAdminPermissionsBodySchema>
export type UpdateAdminPermissionsCtx = ValidatedParamJsonCtx<
  UpdateAdminPermissionsParams,
  UpdateAdminPermissionsBody
>
