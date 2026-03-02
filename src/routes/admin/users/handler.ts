import { HttpStatus } from '@/net/http'
import { searchUsers } from '@/use-cases/admin'

import type { GetUsersCtx } from './schema'

export const getUsersHandler = async (c: GetUsersCtx) => {
  const { search, roles, statuses, page, limit } = c.req.valid('query')

  const filters = { search, roles, statuses }
  const pagination = { page, limit }
  const { data, pagination: paginationResult } = await searchUsers(filters, pagination)

  return c.json({ ...data, pagination: paginationResult }, HttpStatus.OK)
}
