import type { Context } from 'hono'

import type { AppContext } from '@/context'

import { normalizeUser } from '@/data'

import type { UpdateProfileBody } from './schema'

import { getUser, updateUser } from './me'

const getHandler = async (c: Context<AppContext>) => {
  const userContext = c.get('user')

  const user = await getUser(userContext.id)

  return c.json({ user: normalizeUser(user) })
}

const postHandler = async (c: Context<AppContext>) => {
  const user = c.get('user')
  const { firstName, lastName } = await c.req.json<UpdateProfileBody>()

  const updatedUser = await updateUser(user.id, {
    firstName: firstName ?? undefined,
    lastName: lastName ?? undefined,
  })

  return c.json({ user: normalizeUser(updatedUser) })
}

export { getHandler, postHandler }
