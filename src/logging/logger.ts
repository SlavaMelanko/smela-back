import type { DestinationStream, TransportTargetOptions } from 'pino'

import pino from 'pino'

import env, { isDevOrTestEnv } from '@/env'

const targets: TransportTargetOptions[] = isDevOrTestEnv()
  ? [
      {
        target: 'pino-pretty',
        level: env.LOG_LEVEL,
        options: {
          destination: 1, // stdout
          colorize: true,
        },
      },
    ]
  : [
      {
        target: 'pino/file',
        level: env.LOG_LEVEL,
        options: {
          destination: 1, // stdout (JSON format for production)
        },
      },
    ]

const transport = pino.transport({ targets }) as DestinationStream

const logger = pino({
  level: env.LOG_LEVEL,
}, transport)

export default logger
