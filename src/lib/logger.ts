import pino from 'pino'
import pretty from 'pino-pretty'

import env, { isDevEnv } from '@/lib/env'

const logger = pino({
  level: env.LOG_LEVEL,
}, isDevEnv() ? pretty() : undefined)

export default logger
