import type { TransportTargetOptions } from 'pino'

import { createConsoleTransport } from './console'

export const getTransports = (): TransportTargetOptions[] => {
  const transports: TransportTargetOptions[] = [
    createConsoleTransport(),
  ]

  // Future: Add remote transport when configured
  // Example:
  // const remoteTransport = createRemoteTransport()
  // if (remoteTransport) {
  //   transports.push(remoteTransport)
  // }

  return transports
}
