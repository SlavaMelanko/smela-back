import { HttpStatus } from '@/net/http'
import { getAdmin, getAdmins, inviteAdmin } from '@/use-cases/owner'

import type { GetAdminCtx, GetAdminsCtx, InviteAdminCtx } from './schema'

export const getAdminsHandler = async (c: GetAdminsCtx) => {
  const { search, statuses, page, limit } = c.req.valid('query')

  const filters = { search, roles: [], statuses }
  const pagination = { page, limit }
  const { data, pagination: paginationResult } = await getAdmins(filters, pagination)

  return c.json({ ...data, pagination: paginationResult }, HttpStatus.OK)
}

export const getAdminHandler = async (c: GetAdminCtx) => {
  const { id } = c.req.valid('param')

  const result = await getAdmin(id)

  return c.json(result.data, HttpStatus.OK)
}

export const inviteAdminHandler = async (c: InviteAdminCtx) => {
  const body = c.req.valid('json')

  const result = await inviteAdmin(body)

  return c.json(result.data, HttpStatus.CREATED)
}
