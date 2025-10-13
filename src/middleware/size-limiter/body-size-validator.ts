import { AppError, ErrorCode } from '@/errors'
import logger from '@/lib/logger'

import { DEFAULT_STREAMING_THRESHOLD } from './constants'

const validateBodySizeStreaming = async (request: Request, maxSize: number): Promise<{
  ok: boolean
  bodySize: number
}> => {
  const reader = request.body?.getReader()

  if (!reader) {
    // No body to read
    return { ok: true, bodySize: 0 }
  }

  let totalSize = 0

  try {
    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        break
      }

      totalSize += value.byteLength

      // Early termination if size exceeds limit
      if (totalSize > maxSize) {
        // Cancel the stream to stop reading
        await reader.cancel()

        return { ok: false, bodySize: totalSize }
      }
    }

    return { ok: true, bodySize: totalSize }
  } catch (error) {
    logger.error({ error }, 'Stream validation error')
    throw error
  } finally {
    // Ensure reader is released
    try {
      reader.releaseLock()
    } catch {
      // Reader might already be released
    }
  }
}

/**
 * Validates the actual body size of a request.
 * Automatically determines whether to use streaming based on Content-Length and max size.
 */
export const validateBodySize = async (
  request: Request,
  maxSize: number,
  contentLength: number | null,
): Promise<number> => {
  // Determine whether to use streaming based on Content-Length or max size
  const shouldUseStreaming
    = (contentLength !== null && contentLength > DEFAULT_STREAMING_THRESHOLD)
      || (maxSize > DEFAULT_STREAMING_THRESHOLD)

  let actualSize: number = 0

  if (shouldUseStreaming) {
    // Use streaming validation for large payloads
    const { ok, bodySize } = await validateBodySizeStreaming(request, maxSize)

    if (!ok) {
      logger.warn({
        actualSize,
        maxSize,
        contentLength: contentLength || 'not provided',
      }, 'Request body too large (streaming validation)')

      throw new AppError(ErrorCode.RequestTooLarge)
    }

    actualSize = bodySize
  } else {
    // Use arrayBuffer for small payloads
    const body = await request.arrayBuffer()
    actualSize = body.byteLength

    if (actualSize > maxSize) {
      logger.warn({
        actualSize,
        maxSize,
        contentLength: contentLength || 'not provided',
      }, 'Request body too large (actual size)')

      throw new AppError(ErrorCode.RequestTooLarge)
    }
  }

  return actualSize
}
