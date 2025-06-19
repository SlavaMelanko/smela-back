import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { requestId } from 'hono/request-id'

import type { AppContext } from '@/types/context'

import { jwtMiddleware, loggerMiddleware, onError } from '@/middleware'
import { privateRoutes, publicRoutes } from '@/routes'

const app = new Hono<AppContext>({ strict: false })

app
  .use(cors())
  .use(requestId())
  .use(loggerMiddleware)
  .use('/api/v1/*', jwtMiddleware)

app.onError(onError)

publicRoutes.forEach((route) => {
  app.route('/', route)
})

privateRoutes.forEach((route) => {
  app.route('/api/v1', route)
})

export default app
