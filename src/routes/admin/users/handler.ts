import { HttpStatus } from '@/net/http'
import { searchUsers } from '@/use-cases/admin'

import type { ListUsersCtx } from './schema'

const adminUsersHandler = async (c: ListUsersCtx) => {
  const { roles, statuses, page, limit } = c.req.valid('query')

  const filters = { roles, statuses }
  const pagination = { page, limit }
  const result = await searchUsers(filters, pagination)

  return c.json(result.data, HttpStatus.OK)
}

export default adminUsersHandler
