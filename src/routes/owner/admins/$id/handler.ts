import { HttpStatus } from '@/net/http'
import {
  cancelAdminInvite,
  getAdmin,
  resendAdminInvite,
  updateAdmin,
} from '@/use-cases/owner'

import type {
  CancelAdminInviteCtx,
  GetAdminCtx,
  ResendAdminInviteCtx,
  UpdateAdminCtx,
} from './schema'

export const getAdminHandler = async (c: GetAdminCtx) => {
  const { adminId } = c.req.valid('param')

  const result = await getAdmin(adminId)

  return c.json(result, HttpStatus.OK)
}

export const updateAdminHandler = async (c: UpdateAdminCtx) => {
  const { adminId } = c.req.valid('param')
  const body = c.req.valid('json')

  const result = await updateAdmin(adminId, body)

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
