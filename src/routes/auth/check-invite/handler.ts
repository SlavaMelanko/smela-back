import { HttpStatus } from '@/net/http'
import checkInvite from '@/use-cases/auth/check-invite'

import type { CheckInviteCtx } from './schema'

const checkInviteHandler = async (c: CheckInviteCtx) => {
  const payload = c.req.valid('json')

  const result = await checkInvite(payload.data.token)

  return c.json({ data: result }, HttpStatus.OK)
}

export default checkInviteHandler
