import type { ContentfulStatusCode } from 'hono/utils/http-status'
import type { StatusCodes } from 'http-status-codes'

import { HTTPException } from 'hono/http-exception'
import { getReasonPhrase } from 'http-status-codes'

class HttpError extends HTTPException {
  constructor(status: StatusCodes, message?: string) {
    const errorMessage = message ?? getReasonPhrase(status)

    super(<ContentfulStatusCode>status, {
      res: new Response(
        JSON.stringify({ error: errorMessage }),
        {
          status,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    })

    // Store the message on the error instance for middleware access
    this.message = errorMessage
  }
}

export default HttpError
