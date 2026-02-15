import type { MiddlewareHandler } from 'hono'

import { secureHeaders } from 'hono/secure-headers'

import { createSecureHeadersConfig } from './config'

export const secureHeadersMiddleware: MiddlewareHandler = secureHeaders(
  createSecureHeadersConfig(),
)
