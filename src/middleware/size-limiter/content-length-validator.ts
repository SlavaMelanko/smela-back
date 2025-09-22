import { AppError, ErrorCode } from '@/lib/catch'
import logger from '@/lib/logger'

export const validateContentLengthHeader = (contentHeader: string | null | undefined, maxSize: number): number | null => {
  if (!contentHeader) {
    return null
  }

  const contentLength = +contentHeader

  if (Number.isNaN(contentLength) || contentLength < 0) {
    logger.warn({ contentLength: contentHeader }, 'Invalid Content-Length header')

    throw new AppError(ErrorCode.InvalidContentLength)
  }

  if (contentLength > maxSize) {
    logger.warn({
      length: contentLength,
      maxSize,
    }, 'Request body too large (Content-Length)')

    throw new AppError(ErrorCode.RequestTooLarge)
  }

  return contentLength
}
