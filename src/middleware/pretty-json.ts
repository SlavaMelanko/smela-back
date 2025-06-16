import type { MiddlewareHandler } from 'hono'

import { prettyJSON } from 'hono/pretty-json'

const prettyJsonMiddleware: MiddlewareHandler | null
  = Bun.env.NODE_ENV === 'development' ? prettyJSON() : null

export default prettyJsonMiddleware
