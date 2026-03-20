import { HttpStatus } from '@/net/http'
import { requestPasswordReset } from '@/use-cases/auth/request-password-reset'

import type { RequestPasswordResetCtx } from './schema'

export const requestPasswordResetHandler = async (c: RequestPasswordResetCtx) => {
  const { email, preferences } = c.req.valid('json')

  const result = await requestPasswordReset({ email }, preferences)

  return c.json(result, HttpStatus.ACCEPTED)
}
