import type { TransportTargetOptions } from 'pino'

import env, { isDevOrTestEnv } from '@/env'

export const createConsoleTransport = (): TransportTargetOptions => {
  return isDevOrTestEnv()
    ? {
        target: 'pino-pretty',
        level: env.LOG_LEVEL,
        options: {
          destination: 1, // stdout
          colorize: true,
        },
      }
    : {
        target: 'pino/file',
        level: env.LOG_LEVEL,
        options: {
          destination: 1, // stdout (JSON format)
        },
      }
}
