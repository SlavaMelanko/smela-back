import ErrorCode from '@/errors/codes'
import { HttpStatus } from '@/net/http'

const httpStatusMap: Record<ErrorCode, HttpStatus> = {
  // Auth errors
  [ErrorCode.AlreadyVerified]: HttpStatus.BAD_REQUEST,
  [ErrorCode.EmailAlreadyInUse]: HttpStatus.CONFLICT,
  [ErrorCode.Forbidden]: HttpStatus.FORBIDDEN,
  [ErrorCode.InvalidCredentials]: HttpStatus.UNAUTHORIZED,
  [ErrorCode.Unauthorized]: HttpStatus.UNAUTHORIZED,

  // Token errors
  [ErrorCode.TokenAlreadyUsed]: HttpStatus.BAD_REQUEST,
  [ErrorCode.TokenDeprecated]: HttpStatus.GONE,
  [ErrorCode.TokenExpired]: HttpStatus.UNAUTHORIZED,
  [ErrorCode.TokenNotFound]: HttpStatus.BAD_REQUEST,
  [ErrorCode.TokenTypeMismatch]: HttpStatus.BAD_REQUEST,

  // Refresh token errors
  [ErrorCode.InvalidRefreshToken]: HttpStatus.UNAUTHORIZED,
  [ErrorCode.RefreshTokenExpired]: HttpStatus.UNAUTHORIZED,
  [ErrorCode.RefreshTokenRevoked]: HttpStatus.UNAUTHORIZED,
  [ErrorCode.MissingRefreshToken]: HttpStatus.BAD_REQUEST,

  // Captcha errors
  [ErrorCode.CaptchaInvalidToken]: HttpStatus.BAD_REQUEST,
  [ErrorCode.CaptchaValidationFailed]: HttpStatus.BAD_REQUEST,

  // Resource errors
  [ErrorCode.Conflict]: HttpStatus.CONFLICT,
  [ErrorCode.NotFound]: HttpStatus.NOT_FOUND,

  // System errors
  [ErrorCode.InternalError]: HttpStatus.INTERNAL_SERVER_ERROR,
  [ErrorCode.ValidationError]: HttpStatus.BAD_REQUEST,

  // Request errors
  [ErrorCode.RequestTooLarge]: HttpStatus.REQUEST_TOO_LONG,
  [ErrorCode.InvalidContentLength]: HttpStatus.BAD_REQUEST,
  [ErrorCode.ContentLengthMismatch]: HttpStatus.BAD_REQUEST,
  [ErrorCode.BadRequest]: HttpStatus.BAD_REQUEST,
}

export const getHttpStatus = (code: ErrorCode): HttpStatus => {
  return httpStatusMap[code] ?? HttpStatus.INTERNAL_SERVER_ERROR
}
