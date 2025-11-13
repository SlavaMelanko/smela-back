// IMPORTANT: When adding, removing, or updating error codes in this enum,
// you must also update the httpStatusMap in @/handlers/http-status-mapper.ts
// to ensure all error codes have corresponding HTTP status mappings
enum ErrorCode {
  AlreadyVerified = 'auth/already-verified',
  BadCredentials = 'auth/bad-credentials',
  EmailAlreadyInUse = 'auth/email-already-in-use',
  Forbidden = 'auth/unverified-account',
  InvalidCredentials = 'auth/invalid-credentials',
  Unauthorized = 'auth/unauthorized',

  TokenAlreadyUsed = 'token/already-used',
  TokenDeprecated = 'token/deprecated',
  TokenExpired = 'token/expired',
  TokenNotFound = 'token/not-found',
  TokenTypeMismatch = 'token/type-mismatch',

  InvalidRefreshToken = 'refresh-token/invalid',
  RefreshTokenExpired = 'refresh-token/expired',
  RefreshTokenRevoked = 'refresh-token/revoked',
  MissingRefreshToken = 'refresh-token/missing',

  CaptchaInvalidToken = 'captcha/invalid-token',
  CaptchaValidationFailed = 'captcha/validation-failed',

  InternalError = 'system/internal-error',
  NotFound = 'resource/not-found',
  ValidationError = 'validation/error',

  RequestTooLarge = 'request/too-large',
  InvalidContentLength = 'request/invalid-content-length',
  ContentLengthMismatch = 'request/content-length-mismatch',
  BadRequest = 'request/bad',
}

export default ErrorCode
