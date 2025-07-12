import type { ErrorHandler } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'

import { getReasonPhrase } from 'http-status-codes'
import { StatusCodes } from 'http-status-codes'

import { isProdEnv } from '@/lib/env'
import logger from '@/lib/logger'

const getHttpStatus = (err: unknown): number => {
  if (err && typeof err === 'object' && 'status' in err && typeof err.status === 'number') {
    return err.status
  }

  return StatusCodes.INTERNAL_SERVER_ERROR
}

const onError: ErrorHandler = (err, c) => {
  logger.error(err)

  const status = getHttpStatus(err)
  const message = err.message || getReasonPhrase(status)
  const name = err.name || 'BackendError'
  const stack = isProdEnv() ? undefined : err.stack

  return c.json(
    {
      error: message,
      name,
      stack,
    },
    <ContentfulStatusCode>status,
  )
}

export default onError
