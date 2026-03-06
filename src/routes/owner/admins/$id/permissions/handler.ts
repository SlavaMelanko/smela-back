import { HttpStatus } from '@/net/http'
import { getAdminPermissions, updateAdminPermissions } from '@/use-cases/owner'

import type { GetAdminPermissionsCtx, UpdateAdminPermissionsCtx } from './schema'

export const getAdminPermissionsHandler = async (c: GetAdminPermissionsCtx) => {
  const { adminId } = c.req.valid('param')

  const result = await getAdminPermissions(adminId)

  return c.json(result, HttpStatus.OK)
}

export const updateAdminPermissionsHandler = async (c: UpdateAdminPermissionsCtx) => {
  const { adminId } = c.req.valid('param')
  const { permissions } = c.req.valid('json')

  const result = await updateAdminPermissions(adminId, permissions)

  return c.json(result, HttpStatus.OK)
}
