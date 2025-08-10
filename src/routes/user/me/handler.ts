import type { Context } from 'hono'

import type { AppContext } from '@/types/context'

import { normalizeUser } from '@/lib/user'

import { getUser, updateUser } from './me'

const getHandler = async (c: Context<AppContext>) => {
  const userContext = c.get('user')

  const user = await getUser(userContext.id)

  return c.json({ user: normalizeUser(user) })
}

const postHandler = async (c: Context<AppContext>) => {
  const user = c.get('user')
  const body = await c.req.json()

  const updatedUser = await updateUser(user.id, { ...body })

  return c.json({ user: normalizeUser(updatedUser) })
}

export { getHandler, postHandler }
