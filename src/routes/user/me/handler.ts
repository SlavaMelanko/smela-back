import type { AppCtx } from '@/routes/validated-ctx'

import { getRefreshCookie } from '@/net/http/cookie/refresh-token'
import { changePassword, getUser, updateUser } from '@/use-cases/user/me'

import type { ChangePasswordCtx, UpdateProfileCtx } from './schema'

export const getMeHandler = async (c: AppCtx) => {
  const user = c.get('user')

  const result = await getUser(user.id)

  return c.json(result)
}

export const updateMeHandler = async (c: UpdateProfileCtx) => {
  const user = c.get('user')
  const body = c.req.valid('json')

  const result = await updateUser(user.id, body)

  return c.json(result)
}

export const changePasswordHandler = async (c: ChangePasswordCtx) => {
  const user = c.get('user')
  const { currentPassword, newPassword } = c.req.valid('json')
  const refreshToken = getRefreshCookie(c)

  const result = await changePassword(user.id, currentPassword, newPassword, refreshToken)

  return c.json(result)
}
