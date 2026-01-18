import type { Context } from 'hono'

import { pinoLogger } from 'hono-pino'

import { logger } from '@/logging'

const onReqBindings = (c: Context) => {
  const url = new URL(c.req.url)
  const query = Object.fromEntries(url.searchParams)
  const params = c.req.param()

  return {
    reqId: c.get('requestId'),
    req: {
      url: c.req.path,
      method: c.req.method,
      headers: c.req.header(),
      ...(Object.keys(query).length > 0 && { query }),
      ...(Object.keys(params).length > 0 && { params }),
    },
  }
}

const onResBindings = (c: Context) => ({
  res: {
    status: c.res.status,
    headers: Object.fromEntries(c.res.headers),
  },
})

const loggerMiddleware = pinoLogger({
  pino: logger,
  http: {
    onReqBindings,
    onResBindings,
  },
})

export default loggerMiddleware
