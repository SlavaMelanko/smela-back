import type { ContentfulStatusCode } from 'hono/utils/http-status'
import type { StatusCodes } from 'http-status-codes'

import { HTTPException } from 'hono/http-exception'
import { getReasonPhrase } from 'http-status-codes'

class HttpError extends HTTPException {
  constructor(status: StatusCodes, message?: string) {
    super(<ContentfulStatusCode>status, {
      res: new Response(
        JSON.stringify({ error: message ?? getReasonPhrase(status) }),
        {
          status,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    })
  }
}

export default HttpError
