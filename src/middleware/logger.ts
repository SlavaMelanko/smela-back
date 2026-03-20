import { pinoLogger } from 'hono-pino'

import { logger } from '@/logging'

export const loggerMiddleware = pinoLogger({
  pino: logger,
})
