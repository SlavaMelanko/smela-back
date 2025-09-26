import { Hono } from 'hono'

import { loggerMiddleware, onError } from '@/middleware'

/**
 * Creates a test Hono app with middleware and routes configured
 */
export const createTestApp = (basePath: string, route: any): Hono => {
  const app = new Hono()

  // Set up error handling and logging middleware
  app.onError(onError)
  app.use(loggerMiddleware)

  // Mount the route at the specified base path
  app.route(basePath, route)

  return app
}
