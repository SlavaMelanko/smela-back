import type { NotFoundHandler } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'

import type { AppContext } from '@/context'

import { ErrorCode, ErrorRegistry } from '@/errors'

const notFound: NotFoundHandler<AppContext> = (c) => {
  const code = ErrorCode.NotFound
  const { error, status } = ErrorRegistry[code]

  return c.json(
    {
      error,
      code,
      path: c.req.path,
    },
    status as ContentfulStatusCode,
  )
}

export default notFound
