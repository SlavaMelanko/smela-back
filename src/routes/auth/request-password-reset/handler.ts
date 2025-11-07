import type { Context } from 'hono'

import { HttpStatus } from '@/net/http'
import requestPasswordReset from '@/use-cases/auth/request-password-reset'

import type { RequestPasswordResetBody } from './schema'

const requestPasswordResetHandler = async (c: Context) => {
  const { email } = await c.req.json<RequestPasswordResetBody>()

  const { data } = await requestPasswordReset(email)

  return c.json(data, HttpStatus.ACCEPTED)
}

export default requestPasswordResetHandler
