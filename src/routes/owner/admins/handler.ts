import { HttpStatus } from '@/net/http'
import { getAdmin, getAdmins, inviteAdmin, resendAdminInvitation } from '@/use-cases/owner'

import type { CreateInvitationCtx, GetAdminCtx, GetAdminsCtx, ResendInvitationCtx } from './schema'

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

  return c.json(result, HttpStatus.OK)
}

export const createInvitationHandler = async (c: CreateInvitationCtx) => {
  const body = c.req.valid('json')
  const { id: invitedBy } = c.get('user')

  const result = await inviteAdmin(body, invitedBy)

  return c.json(result, HttpStatus.CREATED)
}

export const resendInvitationHandler = async (c: ResendInvitationCtx) => {
  const { adminId } = c.req.valid('param')

  const result = await resendAdminInvitation(adminId)

  return c.json(result, HttpStatus.OK)
}
