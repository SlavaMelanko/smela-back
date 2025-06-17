import { pinoLogger } from 'hono-pino'

import logger from '@/lib/logger'

const loggerMiddleware = pinoLogger({
  pino: logger,
  http: {
    reqId: () => crypto.randomUUID(),
  },
})

export default loggerMiddleware
