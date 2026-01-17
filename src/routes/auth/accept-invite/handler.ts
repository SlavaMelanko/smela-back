import { getDeviceInfo, HttpStatus, setRefreshCookie } from '@/net/http'
import acceptInvite from '@/use-cases/auth/accept-invite'

import type { AcceptInviteCtx } from './schema'

const acceptInviteHandler = async (c: AcceptInviteCtx) => {
  const payload = c.req.valid('json')
  const deviceInfo = getDeviceInfo(c)

  const result = await acceptInvite({ ...payload.data, deviceInfo })

  setRefreshCookie(c, result.refreshToken)

  return c.json(result.data, HttpStatus.OK)
}

export default acceptInviteHandler
