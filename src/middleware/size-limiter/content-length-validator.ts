import { AppError, ErrorCode } from '@/errors'

export const validateContentLengthHeader = (
  contentHeader: string | null | undefined,
  maxSize: number,
): number | null => {
  if (!contentHeader) {
    return null
  }

  const contentLength = +contentHeader

  if (Number.isNaN(contentLength) || contentLength < 0) {
    throw new AppError(ErrorCode.InvalidContentLength)
  }

  if (contentLength > maxSize) {
    throw new AppError(ErrorCode.RequestTooLarge)
  }

  return contentLength
}
