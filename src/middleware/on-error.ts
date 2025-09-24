import type { ErrorHandler } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'

import { HTTPException } from 'hono/http-exception'
import { getReasonPhrase, StatusCodes } from 'http-status-codes'

import { ErrorCode, ErrorRegistry } from '@/lib/catch'
import { isDevEnv } from '@/lib/env'
import logger from '@/lib/logger'

const getErrorCode = (err: unknown): ErrorCode => {
  if (err instanceof HTTPException) {
    if (err.status >= StatusCodes.BAD_REQUEST
      && err.status < StatusCodes.INTERNAL_SERVER_ERROR) {
      return ErrorCode.BadRequest
    }

    if (err.status >= StatusCodes.INTERNAL_SERVER_ERROR) {
      return ErrorCode.InternalError
    }
  }

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
  const stack = isDevEnv() ? err.stack : undefined

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
