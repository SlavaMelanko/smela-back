import type { Context } from 'hono'

import { HttpStatus } from '@/lib/http-status'

import resetPassword from './reset-password'

const resetPasswordHandler = async (c: Context) => {
  const { token, password } = await c.req.json()

  const result = await resetPassword({ token, password })

  return c.json(result, HttpStatus.OK)
}

export default resetPasswordHandler
