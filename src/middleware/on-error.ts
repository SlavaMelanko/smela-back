import type { ErrorHandler } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'

import { getReasonPhrase, StatusCodes } from 'http-status-codes'

import { isProdEnv } from '@/lib/env'
import logger from '@/lib/logger'

const onError: ErrorHandler = (err, c) => {
  logger.error(err)

  const status = 'status' in err && typeof err.status === 'number'
    ? err.status
    : StatusCodes.INTERNAL_SERVER_ERROR

  const message = err.message || getReasonPhrase(status)

  const stack = isProdEnv() ? undefined : err.stack

  return c.json(
    {
      error: message,
      stack,
    },
    <ContentfulStatusCode>status,
  )
}

export default onError
