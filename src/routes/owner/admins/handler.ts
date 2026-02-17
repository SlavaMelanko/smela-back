import { HttpStatus } from '@/net/http'
import { cancelAdminInvite, getAdmin, getAdmins, inviteAdmin, resendAdminInvite } from '@/use-cases/owner'

import type { CancelAdminInviteCtx, CreateAdminCtx, GetAdminCtx, GetAdminsCtx, ResendAdminInviteCtx } from './schema'

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

export const getAdminHandler = async (c: GetAdminCtx) => {
  const { adminId } = c.req.valid('param')

  const result = await getAdmin(adminId)

  return c.json(result, HttpStatus.OK)
}

export const resendAdminInviteHandler = async (c: ResendAdminInviteCtx) => {
  const { adminId } = c.req.valid('param')
  const { id: inviterId } = c.get('user')

  const result = await resendAdminInvite(adminId, inviterId)

  return c.json(result, HttpStatus.OK)
}

export const cancelAdminInviteHandler = async (c: CancelAdminInviteCtx) => {
  const { adminId } = c.req.valid('param')

  const result = await cancelAdminInvite(adminId)

  return c.json(result, HttpStatus.OK)
}
