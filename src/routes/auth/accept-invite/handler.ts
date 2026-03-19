import { getDeviceInfo, HttpStatus, setRefreshCookie } from '@/net/http'
import { acceptInvite } from '@/use-cases/auth/accept-invite'

import type { AcceptInviteCtx } from './schema'

export const acceptInviteHandler = async (c: AcceptInviteCtx) => {
  const { token, password } = c.req.valid('json')
  const deviceInfo = getDeviceInfo(c)

  const result = await acceptInvite({ token, password }, deviceInfo)

  setRefreshCookie(c, result.refreshToken)

  return c.json(result.data, HttpStatus.OK)
}
