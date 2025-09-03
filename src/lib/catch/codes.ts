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

  InternalError = 'system/internal-error',
  NotFound = 'resource/not-found',
  ValidationError = 'validation/error',

  RequestTooLarge = 'request/too-large',
  InvalidContentLength = 'request/invalid-content-length',
  ContentLengthMismatch = 'request/content-length-mismatch',
}

export default ErrorCode
