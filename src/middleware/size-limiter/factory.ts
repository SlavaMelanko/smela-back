import type { MiddlewareHandler } from 'hono'

import { createMiddleware } from 'hono/factory'

import type { AppContext } from '@/context'

import { AppError, ErrorCode } from '@/errors'

import { validateBodySize } from './body-size-validator'
import { DEFAULT_MAX_SIZE } from './constants'
import { validateContentLengthHeader } from './content-length-validator'

export interface RequestSizeLimiterOptions {
  maxSize?: number
}

export const createRequestSizeLimiter = (
  options: RequestSizeLimiterOptions = {},
): MiddlewareHandler<AppContext> => {
  const {
    maxSize = DEFAULT_MAX_SIZE,
  } = options

  return createMiddleware<AppContext>(async (c, next) => {
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
        throw new AppError(ErrorCode.ContentLengthMismatch)
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }

      throw new AppError(ErrorCode.ValidationError, 'Failed to validate request size')
    }

    await next()
  })
}
