import type { Context } from 'hono'

import type { AppContext } from '@/context'

import { getUser, updateUser } from '@/use-cases/user/me'

import type { UpdateProfileBody } from './schema'

const getHandler = async (c: Context<AppContext>) => {
  const user = c.get('user')

  const result = await getUser(user.id)

  return c.json(result.data)
}

const postHandler = async (c: Context<AppContext>) => {
  const user = c.get('user')
  const payload = await c.req.json<UpdateProfileBody>()

  const result = await updateUser(user.id, payload.data)

  return c.json(result.data)
}

export { getHandler, postHandler }
