import { HttpStatus } from '@/net/http'
import resetPassword from '@/use-cases/auth/reset-password'

import type { ValidatedCtx } from '../../@shared'
import type { ResetPasswordBody } from './schema'

const resetPasswordHandler = async (c: ValidatedCtx<ResetPasswordBody>) => {
  const payload = c.req.valid('json')

  const result = await resetPassword(payload.data)

  return c.json(result.data, HttpStatus.OK)
}

export default resetPasswordHandler
