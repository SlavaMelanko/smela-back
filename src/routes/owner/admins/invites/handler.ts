import { HttpStatus } from '@/net/http'
import { inviteAdmin, resendAdminInvitation } from '@/use-cases/owner'

import type { InviteAdminCtx, ResendAdminInviteCtx } from './schema'

export const createInviteHandler = async (c: InviteAdminCtx) => {
  const body = c.req.valid('json')
  const { id: inviterId } = c.get('user')

  const result = await inviteAdmin(body, inviterId)

  return c.json(result, HttpStatus.CREATED)
}

export const resendInviteHandler = async (c: ResendAdminInviteCtx) => {
  const { adminId } = c.req.valid('param')
  const { id: inviterId } = c.get('user')

  const result = await resendAdminInvitation(adminId, inviterId)

  return c.json(result, HttpStatus.OK)
}
