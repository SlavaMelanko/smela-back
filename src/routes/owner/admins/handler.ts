import type { Handler } from 'hono'

import type { AppContext } from '@/context'

import { HttpStatus } from '@/net/http'
import { getAdminDefaultPermissions } from '@/types'
import { getAdmins, inviteAdmin } from '@/use-cases/owner'

import type { CreateAdminCtx, GetAdminsCtx } from './schema'

export const getAdminsHandler = async (c: GetAdminsCtx) => {
  const { search, statuses, page, limit } = c.req.valid('query')

  const filters = { search, roles: [], statuses }
  const pagination = { page, limit }
  const { data, pagination: paginationResult } = await getAdmins(filters, pagination)

  return c.json({ ...data, pagination: paginationResult }, HttpStatus.OK)
}

export const createAdminHandler = async (c: CreateAdminCtx) => {
  const body = c.req.valid('json')
  const { id: inviterId } = c.get('user')

  const result = await inviteAdmin(body, inviterId)

  return c.json(result, HttpStatus.CREATED)
}

export const getAdminDefaultPermissionsHandler: Handler<AppContext> = (c) => {
  return c.json({ permissions: getAdminDefaultPermissions() }, HttpStatus.OK)
}
