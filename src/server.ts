import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'
import { requestId } from 'hono/request-id'

import type { AppContext } from '@/context'

import { notFound, onError } from '@/handlers'
import {
  adminAuthMiddleware,
  authRateLimiter,
  authRequestSizeLimiter,
  corsMiddleware,
  generalRateLimiter,
  generalRequestSizeLimiter,
  loggerMiddleware,
  secureHeadersMiddleware,
  userRelaxedAuthMiddleware,
  userStrictAuthMiddleware,
} from '@/middleware'
import {
  adminRoutes,
  authRoutes,
  protectedRoutesAllowNew,
  protectedRoutesVerifiedOnly,
} from '@/routes'

class Server {
  readonly app: Hono<AppContext>

  constructor() {
    this.app = new Hono<AppContext>({ strict: false })
    this.setupMiddleware()
    this.setupRoutes()
    this.setupHandlers()
  }

  private setupMiddleware() {
    this.app
      .use(secureHeadersMiddleware)
      .use(corsMiddleware)
      .use(requestId())
      .use(loggerMiddleware)
      .use(generalRequestSizeLimiter)
      .use(generalRateLimiter)
      .use('/api/v1/auth/*', authRequestSizeLimiter)
      .use('/api/v1/auth/*', authRateLimiter)
      .use('/api/v1/protected/*', userRelaxedAuthMiddleware)
      .use('/api/v1/private/*', userStrictAuthMiddleware)
      .use('/api/v1/admin/*', adminAuthMiddleware)
      .use('/static/*', serveStatic({ root: './' }))
  }

  private setupRoutes() {
    authRoutes.forEach((route) => {
      this.app.route('/api/v1/auth', route)
    })

    protectedRoutesAllowNew.forEach((route) => {
      this.app.route('/api/v1/protected', route)
    })

    protectedRoutesVerifiedOnly.forEach((route) => {
      this.app.route('/api/v1/private', route)
    })

    adminRoutes.forEach((route) => {
      this.app.route('/api/v1/admin', route)
    })
  }

  private setupHandlers() {
    this.app.notFound(notFound)
    this.app.onError(onError)
  }

  getApp() {
    return this.app
  }
}

export default Server
