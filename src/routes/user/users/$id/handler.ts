import { HttpStatus } from '@/net/http'
import { updateUser } from '@/use-cases/admin'

import type { UpdateUserCtx } from './schema'

export const updateUserHandler = async (c: UpdateUserCtx) => {
  const { userId } = c.req.valid('param')
  const body = c.req.valid('json')

  const result = await updateUser(userId, body)

  return c.json(result, HttpStatus.OK)
}
