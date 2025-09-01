import type { MiddlewareHandler } from 'hono'

import { StatusCodes } from 'http-status-codes'

import logger from '@/lib/logger'

const DEFAULT_MAX_SIZE = 100 * 1024 // 100KB default
const AUTH_ROUTES_MAX_SIZE = 10 * 1024 // 10KB for auth routes
const FILE_UPLOAD_MAX_SIZE = 5 * 1024 * 1024 // 5MB for file uploads

interface RequestSizeLimiterOptions {
  maxSize?: number
  onError?: (size: number) => void
}

const createRequestSizeLimiter = (options: RequestSizeLimiterOptions = {}): MiddlewareHandler => {
  const { maxSize = DEFAULT_MAX_SIZE, onError } = options

  return async (c, next) => {
    const contentLength = c.req.header('content-length')

    if (contentLength) {
      const size = Number.parseInt(contentLength, 10)

      if (Number.isNaN(size)) {
        logger.warn('Invalid Content-Length header', { contentLength })

        return c.text('Invalid Content-Length header', StatusCodes.BAD_REQUEST)
      }

      if (size > maxSize) {
        logger.warn('Request body too large', {
          size,
          maxSize,
          path: c.req.path,
        })

        if (onError) {
          onError(size)
        }

        return c.text('Request body too large', StatusCodes.REQUEST_TOO_LONG)
      }
    }

    await next()
  }
}

// Pre-configured middleware instances.
export const generalRequestSizeLimiter = createRequestSizeLimiter()

export const authRequestSizeLimiter = createRequestSizeLimiter({
  maxSize: AUTH_ROUTES_MAX_SIZE,
})

export const fileUploadSizeLimiter = createRequestSizeLimiter({
  maxSize: FILE_UPLOAD_MAX_SIZE,
})

export default createRequestSizeLimiter
