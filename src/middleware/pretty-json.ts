import type { MiddlewareHandler } from 'hono'

import { prettyJSON } from 'hono/pretty-json'

import { isDevEnv } from '@/lib/env'

const prettyJsonMiddleware: MiddlewareHandler | null
  = isDevEnv() ? prettyJSON() : null

export default prettyJsonMiddleware
