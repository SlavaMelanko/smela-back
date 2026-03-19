import { HttpStatus } from '@/net/http'
import { checkInvite } from '@/use-cases/auth/check-invite'

import type { CheckInviteCtx } from './schema'

export const checkInviteHandler = async (c: CheckInviteCtx) => {
  const { token } = c.req.valid('query')

  const result = await checkInvite(token)

  return c.json({ data: result }, HttpStatus.OK)
}
