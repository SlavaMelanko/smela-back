import type { MiddlewareHandler } from 'hono'

import { secureHeaders } from 'hono/secure-headers'

import { createSecureHeadersConfig } from './config'

const secureHeadersMiddleware: MiddlewareHandler = secureHeaders(
  createSecureHeadersConfig(),
)

export default secureHeadersMiddleware
