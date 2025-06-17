import { Hono } from 'hono'

import type { AppContext } from '@/types/context'

import { jwtMiddleware, loggerMiddleware, prettyJsonMiddleware } from '@/middleware'
import { privateRoutes, publicRoutes } from '@/routes'

const app = new Hono<AppContext>({ strict: false })

app.use(loggerMiddleware)

if (prettyJsonMiddleware) {
  app.use(prettyJsonMiddleware)
}

publicRoutes.forEach((route) => {
  app.route('/', route)
})

app.use('/api/v1/*', jwtMiddleware)

privateRoutes.forEach((route) => {
  app.route('/api/v1', route)
})

export default app
