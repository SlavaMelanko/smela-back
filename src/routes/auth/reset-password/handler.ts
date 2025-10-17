import type { Context } from 'hono'

import { HttpStatus } from '@/net/http'
import resetPassword from '@/use-cases/auth/reset-password'

import type { ResetPasswordBody } from './schema'

const resetPasswordHandler = async (c: Context) => {
  const { token, password } = await c.req.json<ResetPasswordBody>()

  const result = await resetPassword({ token, password })

  return c.json(result, HttpStatus.OK)
}

export default resetPasswordHandler
