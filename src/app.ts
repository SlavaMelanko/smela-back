import { Hono } from 'hono'

import type { Variables } from '@/types/context'
import { publicRoutes, privateRoutes } from '@/routes'
import { jwtMiddleware, loggerMiddleware, prettyJsonMiddleware } from '@/middleware'

const app = new Hono<{ Variables: Variables }>()

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
