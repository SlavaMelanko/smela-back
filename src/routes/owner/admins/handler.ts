import { HttpStatus } from '@/net/http'
import { getAdmin, getAdmins } from '@/use-cases/owner'

import type { GetAdminCtx, GetAdminsCtx } from './schema'

export const getAdminsHandler = async (c: GetAdminsCtx) => {
  const { search, statuses, page, limit } = c.req.valid('query')

  const filters = { search, roles: [], statuses }
  const pagination = { page, limit }
  const { data, pagination: paginationResult } = await getAdmins(filters, pagination)

  return c.json({ ...data, pagination: paginationResult }, HttpStatus.OK)
}

export const getAdminHandler = async (c: GetAdminCtx) => {
  const { adminId } = c.req.valid('param')

  const result = await getAdmin(adminId)

  return c.json(result, HttpStatus.OK)
}
