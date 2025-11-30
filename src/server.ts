import type { MiddlewareHandler } from 'hono'

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
  authPublicRoutes,
  userRoutesAllowNew,
  userRoutesVerifiedOnly,
} from '@/routes'

class Server {
  private readonly app: Hono<AppContext>

  constructor() {
    this.app = new Hono<AppContext>({ strict: false })
    this.setupMiddleware()
    this.setupRoutes()
    this.setupHandlers()
  }

  getApp() {
    return this.app
  }

  private setupMiddleware() {
    this.app
      .use(secureHeadersMiddleware)
      .use(corsMiddleware)
      .use(requestId())
      .use(loggerMiddleware)
      .use(generalRequestSizeLimiter)
      .use(generalRateLimiter)
      .use('/static/*', serveStatic({ root: './' }))
  }

  private setupRoutes() {
    this.createRouteGroup(
      '/api/v1/auth',
      authPublicRoutes,
      [authRequestSizeLimiter, authRateLimiter],
    )
    this.createRouteGroup(
      '/api/v1/user',
      userRoutesAllowNew,
      userRelaxedAuthMiddleware,
    )
    this.createRouteGroup(
      '/api/v1/user/verified',
      userRoutesVerifiedOnly,
      userStrictAuthMiddleware,
    )
    this.createRouteGroup(
      '/api/v1/admin',
      adminRoutes,
      adminAuthMiddleware,
    )
  }

  private setupHandlers() {
    this.app.notFound(notFound)
    this.app.onError(onError)
  }

  private createRouteGroup(
    path: string,
    routes: Hono<AppContext>[],
    middleware: MiddlewareHandler | MiddlewareHandler[],
  ) {
    const group = new Hono<AppContext>()

    const middlewareArray = Array.isArray(middleware) ? middleware : [middleware]
    middlewareArray.forEach(mw => group.use(mw))

    routes.forEach(route => group.route('/', route))

    this.app.route(path, group)
  }
}

export default Server
