import { HttpStatus } from '@/net/http'
import { getUser, searchUsers } from '@/use-cases/admin'

import type { UserDetailCtx, UsersSearchCtx } from './schema'

export const adminUsersHandler = async (c: UsersSearchCtx) => {
  const { search, roles, statuses, page, limit } = c.req.valid('query')

  const filters = { search, roles, statuses }
  const pagination = { page, limit }
  const { data, pagination: paginationResult } = await searchUsers(filters, pagination)

  return c.json({ ...data, pagination: paginationResult }, HttpStatus.OK)
}

export const adminUserDetailHandler = async (c: UserDetailCtx) => {
  const { id } = c.req.valid('param')

  const result = await getUser(id)

  return c.json(result.data, HttpStatus.OK)
}
