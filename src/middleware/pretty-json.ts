import { prettyJSON } from 'hono/pretty-json'
import type { MiddlewareHandler } from 'hono'

const prettyJsonMiddleware: MiddlewareHandler | null =
  Bun.env.NODE_ENV === 'development' ? prettyJSON() : null

export default prettyJsonMiddleware
