import type { Context } from 'hono'

import HttpStatus from '@/types/http-status'
import requestPasswordReset from '@/use-cases/auth/request-password-reset'

import type { RequestPasswordResetBody } from './schema'

const requestPasswordResetHandler = async (c: Context) => {
  const { email } = await c.req.json<RequestPasswordResetBody>()

  const result = await requestPasswordReset(email)

  return c.json({ ...result }, HttpStatus.ACCEPTED)
}

export default requestPasswordResetHandler
