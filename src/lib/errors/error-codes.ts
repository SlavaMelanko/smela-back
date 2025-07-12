enum ErrorCode {
  Unauthorized = 'auth:unauthorized',
  BadCredentials = 'auth:bad-credentials',
  EmailAlreadyInUse = 'auth:email-already-in-use',

  TokenExpired = 'token:expired',
  TokenNotFound = 'token:not-found',
  TokenAlreadyUsed = 'token:already-used',
  TokenDeprecated = 'token:deprecated',
  TokenTypeMismatch = 'token:type-mismatch',

  NotFound = 'resource:not-found',
  ValidationError = 'validation:error',
  InternalError = 'system:internal-error',
}

export default ErrorCode
