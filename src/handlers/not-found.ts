import type { NotFoundHandler } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'

import type { AppContext } from '@/context'

import { APP_ERROR_NAME, ErrorCode, ErrorRegistry } from '@/errors'
import { getErrorTracker } from '@/services'

import { getHttpStatus } from './http-status-mapper'

const notFound: NotFoundHandler<AppContext> = (c) => {
  const code = ErrorCode.NotFound
  const error = ErrorRegistry[code].error
  const status = getHttpStatus(code)
  const path = c.req.path

  getErrorTracker().captureMessage(`Not found: ${path}`, 'warning')

  return c.json(
    {
      name: APP_ERROR_NAME,
      code,
      error,
      path,
    },
    status as ContentfulStatusCode,
  )
}

export default notFound
