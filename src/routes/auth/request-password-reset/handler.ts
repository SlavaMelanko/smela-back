import type { Context } from 'hono'

import HttpStatus from '@/lib/http-status'

import requestPasswordReset from './request-password-reset'

const requestPasswordResetHandler = async (c: Context) => {
  const { email } = await c.req.json()

  const result = await requestPasswordReset(email)

  return c.json({ ...result }, HttpStatus.ACCEPTED)
}

export default requestPasswordResetHandler
