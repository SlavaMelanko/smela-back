import type { Context } from 'hono'

import HttpStatus from '@/types/http-status'

import type { RequestPasswordResetBody } from './schema'

import requestPasswordReset from './request-password-reset'

const requestPasswordResetHandler = async (c: Context) => {
  const { email } = await c.req.json<RequestPasswordResetBody>()

  const result = await requestPasswordReset(email)

  return c.json({ ...result }, HttpStatus.ACCEPTED)
}

export default requestPasswordResetHandler
