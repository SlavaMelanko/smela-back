import type { ContentfulStatusCode } from 'hono/utils/http-status'
import type { StatusCodes } from 'http-status-codes'

import { HTTPException } from 'hono/http-exception'

class HttpError extends HTTPException {
  constructor(status: StatusCodes, message?: string) {
    super(<ContentfulStatusCode>status, { message })
  }
}

export default HttpError
