import type { NotFoundHandler } from 'hono'

import type { AppContext } from '@/context'

import ErrorCode from '@/lib/catch/codes'
import ErrorRegistry from '@/lib/catch/registry'

const notFound: NotFoundHandler<AppContext> = (c) => {
  const code = ErrorCode.NotFound
  const { error, status } = ErrorRegistry[code]

  return c.json(
    {
      error,
      code,
      path: c.req.path,
    },
    status as any,
  )
}

export default notFound
