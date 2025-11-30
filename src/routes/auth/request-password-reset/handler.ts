import type { Context } from 'hono'

import { HttpStatus } from '@/net/http'
import requestPasswordReset from '@/use-cases/auth/request-password-reset'

import type { RequestPasswordResetBody } from './schema'

const requestPasswordResetHandler = async (c: Context) => {
  const payload = await c.req.json<RequestPasswordResetBody>()

  const result = await requestPasswordReset(payload.data, payload.preferences)

  return c.json(result.data, HttpStatus.ACCEPTED)
}

export default requestPasswordResetHandler
