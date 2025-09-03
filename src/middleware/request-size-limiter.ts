import type { MiddlewareHandler } from 'hono'

import { AppError, ErrorCode } from '@/lib/catch'
import logger from '@/lib/logger'

const DEFAULT_MAX_SIZE = 100 * 1024 // 100KB default
const AUTH_ROUTES_MAX_SIZE = 10 * 1024 // 10KB for auth routes
const FILE_UPLOAD_MAX_SIZE = 5 * 1024 * 1024 // 5MB for file uploads
const DEFAULT_STREAMING_THRESHOLD = 100 * 1024 // 100KB threshold for streaming

interface RequestSizeLimiterOptions {
  maxSize?: number
}

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

const validateContentLengthHeader = (contentHeader: string | null | undefined, maxSize: number): number | null => {
  if (!contentHeader) {
    return null
  }

  const contentLength = +contentHeader

  if (Number.isNaN(contentLength) || contentLength < 0) {
    logger.warn('Invalid Content-Length header', { contentLength: contentHeader })

    throw new AppError(ErrorCode.InvalidContentLength)
  }

  if (contentLength > maxSize) {
    logger.warn('Request body too large (Content-Length)', {
      length: contentLength,
      maxSize,
    })

    throw new AppError(ErrorCode.RequestTooLarge)
  }

  return contentLength
}

/**
 * Validates the actual body size of a request.
 * Automatically determines whether to use streaming based on Content-Length and max size.
 */
const validateBodySize = async (
  request: Request,
  maxSize: number,
  contentLength: number | null,
): Promise<number> => {
  // Determine whether to use streaming based on Content-Length or max size.
  const shouldUseStreaming
    = (contentLength !== null && contentLength > DEFAULT_STREAMING_THRESHOLD)
      || (maxSize > DEFAULT_STREAMING_THRESHOLD)

  let actualSize: number

  if (shouldUseStreaming) {
    // Use streaming validation for large payloads
    const result = await validateBodySizeStreaming(request, maxSize)

    if (!result.valid) {
      logger.warn('Request body too large (streaming validation)', {
        actualSize: result.actualSize,
        maxSize,
        contentLength: contentLength || 'not provided',
      })

      throw new AppError(ErrorCode.RequestTooLarge)
    }

    actualSize = result.actualSize
  } else {
    // Use arrayBuffer for small payloads
    const body = await request.arrayBuffer()
    actualSize = body.byteLength

    if (actualSize > maxSize) {
      logger.warn('Request body too large (actual size)', {
        actualSize,
        maxSize,
        contentLength: contentLength || 'not provided',
      })

      throw new AppError(ErrorCode.RequestTooLarge)
    }
  }

  return actualSize
}

const createRequestSizeLimiter = (options: RequestSizeLimiterOptions = {}): MiddlewareHandler => {
  const {
    maxSize = DEFAULT_MAX_SIZE,
  } = options

  return async (c, next) => {
    // Skip validation for methods that typically don't have a body.
    if (['GET', 'HEAD', 'DELETE', 'OPTIONS'].includes(c.req.method)) {
      return next()
    }

    try {
      const contentHeader = c.req.header('content-length')
      const contentLength = validateContentLengthHeader(contentHeader, maxSize)

      const clonedRequest = c.req.raw.clone()
      const bodySize = await validateBodySize(clonedRequest, maxSize, contentLength)

      // Validate that Content-Length matches actual size if header was provided.
      if (contentHeader && contentLength !== null && contentLength !== bodySize) {
        logger.warn('Content-Length mismatch', {
          declaredSize: contentLength,
          actualSize: bodySize,
        })

        throw new AppError(ErrorCode.ContentLengthMismatch)
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }

      logger.error('Failed to validate request body size', {
        error,
        path: c.req.path,
        method: c.req.method,
      })

      throw new AppError(ErrorCode.ValidationError, 'Failed to validate request size')
    }

    await next()
  }
}

export const generalRequestSizeLimiter = createRequestSizeLimiter({
  maxSize: DEFAULT_MAX_SIZE,
})

export const authRequestSizeLimiter = createRequestSizeLimiter({
  maxSize: AUTH_ROUTES_MAX_SIZE,
})

export const fileUploadSizeLimiter = createRequestSizeLimiter({
  maxSize: FILE_UPLOAD_MAX_SIZE,
})

export default createRequestSizeLimiter
