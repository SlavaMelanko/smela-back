import { getUser, updateUser } from '@/use-cases/user/me'

import type { AppCtx, JsonCtx } from '../../@shared'
import type { UpdateProfileBody } from './schema'

const getHandler = async (c: AppCtx) => {
  const user = c.get('user')

  const result = await getUser(user.id)

  return c.json(result.data)
}

const postHandler = async (c: JsonCtx<UpdateProfileBody>) => {
  const user = c.get('user')
  const payload = c.req.valid('json')

  const result = await updateUser(user.id, payload.data)

  return c.json(result.data)
}

export { getHandler, postHandler }
