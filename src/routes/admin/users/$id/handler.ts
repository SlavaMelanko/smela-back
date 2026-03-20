import { HttpStatus } from '@/net/http'
import { getUser, updateUser } from '@/use-cases/admin'

import type { UpdateUserCtx, UserIdCtx } from './schema'

export const getUserHandler = async (c: UserIdCtx) => {
  const { id } = c.req.valid('param')

  const result = await getUser(id)

  return c.json(result, HttpStatus.OK)
}

export const updateUserHandler = async (c: UpdateUserCtx) => {
  const { id } = c.req.valid('param')
  const body = c.req.valid('json')

  const result = await updateUser(id, body)

  return c.json(result, HttpStatus.OK)
}
