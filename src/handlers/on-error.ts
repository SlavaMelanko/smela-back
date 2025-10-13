import type { ErrorHandler } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'

import { HTTPException } from 'hono/http-exception'

import { isDevEnv } from '@/env'
import { ErrorCode, ErrorRegistry } from '@/errors'
import HttpStatus, { getReasonPhrase } from '@/lib/http-status'
import logger from '@/lib/logger'

const getErrorCode = (err: unknown): ErrorCode => {
  if (err instanceof HTTPException) {
    if (err.status >= HttpStatus.BAD_REQUEST
      && err.status < HttpStatus.INTERNAL_SERVER_ERROR) {
      return ErrorCode.BadRequest
    }

    if (err.status >= HttpStatus.INTERNAL_SERVER_ERROR) {
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
    status as ContentfulStatusCode,
  )
}

export default onError
