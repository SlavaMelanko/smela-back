import { HttpStatus } from '@/net/http'
import { getAdmin, searchAdmins } from '@/use-cases/owner'

import type { AdminDetailCtx, AdminsSearchCtx } from './schema'

export const ownerAdminsHandler = async (c: AdminsSearchCtx) => {
  const { search, statuses, page, limit } = c.req.valid('query')

  const filters = { search, roles: [], statuses }
  const pagination = { page, limit }
  const { data, pagination: paginationResult } = await searchAdmins(filters, pagination)

  return c.json({ ...data, pagination: paginationResult }, HttpStatus.OK)
}

export const ownerAdminDetailHandler = async (c: AdminDetailCtx) => {
  const { id } = c.req.valid('param')

  const result = await getAdmin(id)

  return c.json(result.data, HttpStatus.OK)
}
