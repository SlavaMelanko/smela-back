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

    // Check Content-Length header if present.
    if (contentLength) {
      const size = Number.parseInt(contentLength, 10)

      if (Number.isNaN(size)) {
        logger.warn('Invalid Content-Length header', { contentLength })

        return c.text('Invalid Content-Length header', StatusCodes.BAD_REQUEST)
      }

      if (size > maxSize) {
        logger.warn('Request body too large (Content-Length)', {
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

    // Validate actual body size to prevent bypassing via missing/incorrect Content-Length.
    // Clone request to avoid consuming the body stream.
    const clonedRequest = c.req.raw.clone()

    try {
      // Use arrayBuffer to get the actual body size.
      const body = await clonedRequest.arrayBuffer()
      const actualSize = body.byteLength

      // Check if actual size exceeds limit.
      if (actualSize > maxSize) {
        logger.warn('Request body too large (actual size)', {
          actualSize,
          maxSize,
          contentLength: contentLength || 'not provided',
          path: c.req.path,
        })

        if (onError) {
          onError(actualSize)
        }

        return c.text('Request body too large', StatusCodes.REQUEST_TOO_LONG)
      }

      // Also validate that Content-Length matches actual size if header was provided.
      if (contentLength) {
        const declaredSize = Number.parseInt(contentLength, 10)
        if (!Number.isNaN(declaredSize) && declaredSize !== actualSize) {
          logger.warn('Content-Length mismatch', {
            declaredSize,
            actualSize,
            path: c.req.path,
          })

          return c.text('Content-Length header does not match actual body size', StatusCodes.BAD_REQUEST)
        }
      }
    } catch (error) {
      // If body parsing fails, it might be due to the request method not having a body (GET, HEAD, etc.).
      // In such cases, we can safely proceed.
      const method = c.req.method
      if (method === 'GET' || method === 'HEAD' || method === 'DELETE' || method === 'OPTIONS') {
        // These methods typically don't have a body, so we can proceed.
        await next()

        return
      }

      logger.error('Failed to validate request body size', {
        error,
        path: c.req.path,
        method,
      })

      // For safety, reject the request if we can't validate the body size.
      return c.text('Failed to validate request size', StatusCodes.BAD_REQUEST)
    }

    await next()
  }
}

export const generalRequestSizeLimiter = createRequestSizeLimiter()

export const authRequestSizeLimiter = createRequestSizeLimiter({
  maxSize: AUTH_ROUTES_MAX_SIZE,
})

export const fileUploadSizeLimiter = createRequestSizeLimiter({
  maxSize: FILE_UPLOAD_MAX_SIZE,
})

export default createRequestSizeLimiter
