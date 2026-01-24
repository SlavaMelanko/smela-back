import { HttpStatus } from '@/net/http'
import requestPasswordReset from '@/use-cases/auth/request-password-reset'

import type { RequestPasswordResetCtx } from './schema'

const requestPasswordResetHandler = async (c: RequestPasswordResetCtx) => {
  const payload = c.req.valid('json')

  const result = await requestPasswordReset(payload.data, payload.preferences)

  return c.json(result, HttpStatus.ACCEPTED)
}

export default requestPasswordResetHandler
