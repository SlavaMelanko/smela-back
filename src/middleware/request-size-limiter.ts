import type { MiddlewareHandler } from 'hono'

import { StatusCodes } from 'http-status-codes'

import logger from '@/lib/logger'

const DEFAULT_MAX_SIZE = 100 * 1024 // 100KB default
const AUTH_ROUTES_MAX_SIZE = 10 * 1024 // 10KB for auth routes
const FILE_UPLOAD_MAX_SIZE = 5 * 1024 * 1024 // 5MB for file uploads
const DEFAULT_STREAMING_THRESHOLD = 100 * 1024 // 100KB threshold for streaming

interface RequestSizeLimiterOptions {
  maxSize?: number
  onError?: (size: number) => void
  useStreaming?: boolean // Enable streaming validation for large payloads.
  streamingThreshold?: number // Size threshold to switch to streaming (default 100KB).
}

/**
 * Validates request body size using streaming to avoid loading entire body into memory.
 * This is more efficient for large payloads like file uploads.
 */
const validateBodySizeStreaming = async (request: Request, maxSize: number): Promise<{
  valid: boolean
  actualSize: number
}> => {
  const reader = request.body?.getReader()

  if (!reader) {
    // No body to read.
    return { valid: true, actualSize: 0 }
  }

  let totalSize = 0

  try {
    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        break
      }

      totalSize += value.byteLength

      // Early termination if size exceeds limit.
      if (totalSize > maxSize) {
        // Cancel the stream to stop reading.
        await reader.cancel()

        return { valid: false, actualSize: totalSize }
      }
    }

    return { valid: true, actualSize: totalSize }
  } catch (error) {
    // Stream error occurred.
    logger.error('Stream validation error', { error })
    throw error
  } finally {
    // Ensure reader is released.
    try {
      reader.releaseLock()
    } catch {
      // Reader might already be released.
    }
  }
}

const createRequestSizeLimiter = (options: RequestSizeLimiterOptions = {}): MiddlewareHandler => {
  const {
    maxSize = DEFAULT_MAX_SIZE,
    onError,
    useStreaming = false,
    streamingThreshold = DEFAULT_STREAMING_THRESHOLD,
  } = options

  return async (c, next) => {
    const contentLength = c.req.header('content-length')
    const contentLengthSize = contentLength ? Number.parseInt(contentLength, 10) : null

    // Check Content-Length header if present.
    if (contentLength) {
      if (Number.isNaN(contentLengthSize!)) {
        logger.warn('Invalid Content-Length header', { contentLength })

        return c.text('Invalid Content-Length header', StatusCodes.BAD_REQUEST)
      }

      if (contentLengthSize! > maxSize) {
        logger.warn('Request body too large (Content-Length)', {
          size: contentLengthSize,
          maxSize,
          path: c.req.path,
        })

        if (onError) {
          onError(contentLengthSize!)
        }

        return c.text('Request body too large', StatusCodes.REQUEST_TOO_LONG)
      }
    }

    // Determine whether to use streaming based on Content-Length or settings.
    const shouldUseStreaming = useStreaming
      || (contentLengthSize !== null && contentLengthSize > streamingThreshold)
      || (maxSize > streamingThreshold)

    // Validate actual body size to prevent bypassing via missing/incorrect Content-Length.
    // Clone request to avoid consuming the body stream.
    const clonedRequest = c.req.raw.clone()

    try {
      let actualSize: number

      if (shouldUseStreaming) {
        // Use streaming validation for large payloads.
        const result = await validateBodySizeStreaming(clonedRequest, maxSize)

        if (!result.valid) {
          logger.warn('Request body too large (streaming validation)', {
            actualSize: result.actualSize,
            maxSize,
            contentLength: contentLength || 'not provided',
            path: c.req.path,
          })

          if (onError) {
            onError(result.actualSize)
          }

          return c.text('Request body too large', StatusCodes.REQUEST_TOO_LONG)
        }

        actualSize = result.actualSize
      } else {
        // Use arrayBuffer for small payloads.
        const body = await clonedRequest.arrayBuffer()
        actualSize = body.byteLength

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
      }

      // Also validate that Content-Length matches actual size if header was provided.
      if (contentLength && contentLengthSize !== null) {
        if (contentLengthSize !== actualSize) {
          logger.warn('Content-Length mismatch', {
            declaredSize: contentLengthSize,
            actualSize,
            path: c.req.path,
            usedStreaming: shouldUseStreaming,
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
  useStreaming: true, // Enable streaming for large file uploads.
  streamingThreshold: 50 * 1024, // Start streaming at 50KB for file uploads.
})

export default createRequestSizeLimiter
