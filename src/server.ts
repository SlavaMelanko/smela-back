import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { requestId } from 'hono/request-id'

import type { AppContext } from '@/types/context'

import { authRateLimiter, generalRateLimiter, jwtMiddleware, loggerMiddleware, onError } from '@/middleware'
import { privateRoutes, publicRoutes } from '@/routes'

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
      .use(generalRateLimiter) // Apply general rate limiting to all routes
      .use('/login', authRateLimiter) // Apply strict rate limiting to login endpoint
      .use('/signup', authRateLimiter) // Apply strict rate limiting to signup endpoint
      .use('/verify-email', authRateLimiter) // Apply strict rate limiting to verify-email endpoint
      .use('/api/v1/*', jwtMiddleware)
  }

  private setupRoutes() {
    publicRoutes.forEach((route) => {
      this.app.route('/', route)
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
