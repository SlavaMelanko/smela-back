import { AppError, ErrorCode } from '@/lib/catch'
import logger from '@/lib/logger'

export const validateContentLengthHeader = (contentHeader: string | null | undefined, maxSize: number): number | null => {
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
