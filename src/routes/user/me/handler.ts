import { getUser, updateUser } from '@/use-cases/user/me'

import type { AppCtx } from '../../@shared'
import type { UpdateProfileCtx } from './schema'

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
