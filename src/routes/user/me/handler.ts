import type { Context } from 'hono'

import type { AppContext } from '@/context'

import { getUser, updateUser } from '@/use-cases/user/me'

import type { UpdateProfileBody } from './schema'

const getHandler = async (c: Context<AppContext>) => {
  const userContext = c.get('user')

  const user = await getUser(userContext.id)

  return c.json({ user })
}

const postHandler = async (c: Context<AppContext>) => {
  const user = c.get('user')
  const { firstName, lastName } = await c.req.json<UpdateProfileBody>()

  const updatedUser = await updateUser(user.id, {
    firstName: firstName ?? undefined,
    lastName: lastName ?? undefined,
  })

  return c.json({ user: updatedUser })
}

export { getHandler, postHandler }
