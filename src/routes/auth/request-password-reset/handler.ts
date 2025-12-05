import { HttpStatus } from '@/net/http'
import requestPasswordReset from '@/use-cases/auth/request-password-reset'

import type { ValidatedCtx } from '../../@shared'
import type { RequestPasswordResetBody } from './schema'

const requestPasswordResetHandler = async (c: ValidatedCtx<RequestPasswordResetBody>) => {
  const payload = c.req.valid('json')

  const result = await requestPasswordReset(payload.data, payload.preferences)

  return c.json(result.data, HttpStatus.ACCEPTED)
}

export default requestPasswordResetHandler
