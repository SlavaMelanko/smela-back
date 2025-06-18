import type { StatusCodes } from 'http-status-codes'

import { getReasonPhrase } from 'http-status-codes'

class HttpError extends Error {
  constructor(public status: StatusCodes, message?: string) {
    super(message ?? getReasonPhrase(status))
    this.name = 'HttpError'
  }
}

export default HttpError
