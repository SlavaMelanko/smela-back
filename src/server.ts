import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'
import { requestId } from 'hono/request-id'

import type { AppContext } from '@/types/context'

import {
  authRateLimiter,
  corsMiddleware,
  generalRateLimiter,
  loggerMiddleware,
  onError,
  relaxedAuthMiddleware,
  strictAuthMiddleware,
} from '@/middleware'
import { authRoutes, protectedRoutesAllowNew, protectedRoutesVerifiedOnly } from '@/routes'

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
      .use('/api/v1/me/*', relaxedAuthMiddleware)
      .use('/api/v1/*', strictAuthMiddleware)
      .use('/static/*', serveStatic({ root: './' }))
  }

  private setupRoutes() {
    authRoutes.forEach((route) => {
      this.app.route('/auth', route)
    })

    const protectedRoutes = [...protectedRoutesAllowNew, ...protectedRoutesVerifiedOnly]
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
