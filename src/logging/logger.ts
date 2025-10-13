import type { DestinationStream } from 'pino'

import pino from 'pino'

import env from '@/env'

import { getTransports } from './transports'

const transport = pino.transport({
  targets: getTransports(),
}) as DestinationStream

const logger = pino({
  level: env.LOG_LEVEL,
}, transport)

export default logger
