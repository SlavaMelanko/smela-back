import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { requestId } from 'hono/request-id'

import type { AppContext } from '@/types/context'

import { authRateLimiter, generalRateLimiter, jwtMiddleware, loggerMiddleware, onError } from '@/middleware'
import { authRoutes, privateRoutes, publicRoutes } from '@/routes'

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
      .use(cors())
      .use(requestId())
      .use(loggerMiddleware)
      .use(generalRateLimiter)
      .use('/auth/*', authRateLimiter)
      .use('/api/v1/*', jwtMiddleware)
  }

  private setupRoutes() {
    publicRoutes.forEach((route) => {
      this.app.route('/', route)
    })

    authRoutes.forEach((route) => {
      this.app.route('/auth', route)
    })

    privateRoutes.forEach((route) => {
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
