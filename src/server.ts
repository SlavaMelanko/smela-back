import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'
import { requestId } from 'hono/request-id'

import type { AppContext } from '@/types/context'

import { authRateLimiter, corsMiddleware, dualAuthMiddleware, generalRateLimiter, loggerMiddleware, onError } from '@/middleware'
import { authRoutes, protectedRoutes } from '@/routes'

class Server {
  readonly app: Hono<AppContext>

  constructor() {
    this.app = new Hono<AppContext>({ strict: false })
    this.setupMiddleware()
    this.setupRoutes()
    this.setupErrorHandler()
  }

  private setupMiddleware() {
    this.app
      .use(corsMiddleware)
      .use(requestId())
      .use(loggerMiddleware)
      .use(generalRateLimiter)
      .use('/auth/*', authRateLimiter)
      .use('/api/v1/*', dualAuthMiddleware)
      .use('/static/*', serveStatic({ root: './' }))
  }

  private setupRoutes() {
    authRoutes.forEach((route) => {
      this.app.route('/auth', route)
    })

    protectedRoutes.forEach((route) => {
      this.app.route('/api/v1', route)
    })
  }

  private setupErrorHandler() {
    this.app.onError(onError)
  }

  getApp() {
    return this.app
  }
}

export default Server
