import { pinoLogger } from 'hono-pino'
import pino from 'pino'
import pretty from 'pino-pretty'

import env, { isDevEnv } from '@/lib/env'

const loggerMiddleware = pinoLogger({
  pino: pino({
    level: env.LOG_LEVEL,
  }, isDevEnv() ? pretty() : undefined),
  http: {
    reqId: () => crypto.randomUUID(),
  },
})

export default loggerMiddleware
