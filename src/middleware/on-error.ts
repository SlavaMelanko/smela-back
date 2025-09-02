import type { ErrorHandler } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'

import { getReasonPhrase } from 'http-status-codes'

import { ErrorCode, ErrorRegistry } from '@/lib/catch'
import { isStagingOrProdEnv } from '@/lib/env'
import logger from '@/lib/logger'

const getErrorCode = (err: unknown): ErrorCode => {
  if (err && typeof err === 'object' && 'code' in err) {
    return err.code as ErrorCode
  }

  return ErrorCode.InternalError
}

const onError: ErrorHandler = (err, c) => {
  logger.error(err)

  const code = getErrorCode(err)

  const error = ErrorRegistry[code]
  const status = error.status
  const message = err.message || error.error || getReasonPhrase(status)
  const name = err.name
  const stack = isStagingOrProdEnv() ? undefined : err.stack

  return c.json(
    {
      code,
      error: message,
      name,
      stack,
    },
    <ContentfulStatusCode>status,
  )
}

export default onError
