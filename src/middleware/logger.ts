import { pinoLogger } from 'hono-pino'

import { logger } from '@/logging'

const loggerMiddleware = pinoLogger({
  pino: logger,
})

export default loggerMiddleware
