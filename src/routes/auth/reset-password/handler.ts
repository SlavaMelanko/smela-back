import type { Context } from 'hono'

import HttpStatus from '@/types/http-status'

import type { ResetPasswordBody } from './schema'

import resetPassword from './reset-password'

const resetPasswordHandler = async (c: Context) => {
  const { token, password } = await c.req.json<ResetPasswordBody>()

  const result = await resetPassword({ token, password })

  return c.json(result, HttpStatus.OK)
}

export default resetPasswordHandler
