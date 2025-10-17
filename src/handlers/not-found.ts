import type { NotFoundHandler } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'

import type { AppContext } from '@/context'

import { APP_ERROR_NAME, ErrorCode, ErrorRegistry } from '@/errors'

import { getHttpStatus } from './http-status-mapper'

const notFound: NotFoundHandler<AppContext> = (c) => {
  const code = ErrorCode.NotFound
  const error = ErrorRegistry[code].error
  const status = getHttpStatus(code)

  return c.json(
    {
      code,
      error,
      name: APP_ERROR_NAME,
      path: c.req.path,
    },
    status as ContentfulStatusCode,
  )
}

export default notFound
