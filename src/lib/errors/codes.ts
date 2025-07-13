enum ErrorCode {
  AlreadyVerified = 'auth:already-verified',
  BadCredentials = 'auth:bad-credentials',
  EmailAlreadyInUse = 'auth:email-already-in-use',
  Forbidden = 'auth:unverified-account',
  Unauthorized = 'auth:unauthorized',
  UserNotFound = 'auth:not-found',

  TokenAlreadyUsed = 'token:already-used',
  TokenDeprecated = 'token:deprecated',
  TokenExpired = 'token:expired',
  TokenNotFound = 'token:not-found',
  TokenTypeMismatch = 'token:type-mismatch',

  InternalError = 'system:internal-error',
  NotFound = 'resource:not-found',
  ValidationError = 'validation:error',
}

export default ErrorCode
