import type { MiddlewareHandler } from 'hono'

import { AppError, ErrorCode } from '@/lib/catch'
import logger from '@/lib/logger'

import { validateBodySize } from './body-size-validator'
import { DEFAULT_MAX_SIZE } from './constants'
import { validateContentLengthHeader } from './content-length-validator'

export interface RequestSizeLimiterOptions {
  maxSize?: number
}

export const createRequestSizeLimiter = (options: RequestSizeLimiterOptions = {}): MiddlewareHandler => {
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
        logger.warn({
          declaredSize: contentLength,
          actualSize: bodySize,
        }, 'Content-Length mismatch')

        throw new AppError(ErrorCode.ContentLengthMismatch)
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }

      logger.error({
        error,
        path: c.req.path,
        method: c.req.method,
      }, 'Failed to validate request body size')

      throw new AppError(ErrorCode.ValidationError, 'Failed to validate request size')
    }

    await next()
  }
}
