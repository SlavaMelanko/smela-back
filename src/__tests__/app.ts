import type { MiddlewareHandler } from 'hono'

import { Hono } from 'hono'

import { onError } from '@/handlers'
import { loggerMiddleware } from '@/middleware'

export const createTestApp = (
  basePath: string,
  route: any,
  additionalMiddleware: MiddlewareHandler[] = [],
): Hono => {
  const app = new Hono()

  app.onError(onError)
  app.use(loggerMiddleware)

  for (const middleware of additionalMiddleware) {
    app.use('*', middleware)
  }

  app.route(basePath, route)

  return app
}
