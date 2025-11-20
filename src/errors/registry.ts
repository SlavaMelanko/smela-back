import ErrorCode from './codes'

interface ErrorDetails {
  error: string
}

const ErrorRegistry: Record<ErrorCode, ErrorDetails> = {
  // Auth errors
  [ErrorCode.AlreadyVerified]: {
    error: 'User is already verified.',
  },
  [ErrorCode.EmailAlreadyInUse]: {
    error: 'Email is already in use.',
  },
  [ErrorCode.Forbidden]: {
    error: 'Unverified account.',
  },
  [ErrorCode.InvalidCredentials]: {
    error: 'Invalid email or password.',
  },
  [ErrorCode.Unauthorized]: {
    error: 'Unauthorized access.',
  },

  // Token errors
  [ErrorCode.TokenAlreadyUsed]: {
    error: 'Token has already been used.',
  },
  [ErrorCode.TokenDeprecated]: {
    error: 'Token has been deprecated.',
  },
  [ErrorCode.TokenExpired]: {
    error: 'Token has expired.',
  },
  [ErrorCode.TokenNotFound]: {
    error: 'Token not found.',
  },
  [ErrorCode.TokenTypeMismatch]: {
    error: 'Token type mismatch.',
  },

  // Refresh token errors
  [ErrorCode.InvalidRefreshToken]: {
    error: 'Invalid refresh token.',
  },
  [ErrorCode.RefreshTokenExpired]: {
    error: 'Refresh token has expired.',
  },
  [ErrorCode.RefreshTokenRevoked]: {
    error: 'Refresh token has been revoked.',
  },
  [ErrorCode.MissingRefreshToken]: {
    error: 'Refresh token is missing.',
  },

  // Captcha errors
  [ErrorCode.CaptchaInvalidToken]: {
    error: 'Invalid reCAPTCHA token.',
  },
  [ErrorCode.CaptchaValidationFailed]: {
    error: 'reCAPTCHA token validation failed.',
  },

  // System errors
  [ErrorCode.InternalError]: {
    error: 'Internal server error.',
  },
  [ErrorCode.NotFound]: {
    error: 'Resource not found.',
  },
  [ErrorCode.ValidationError]: {
    error: 'Validation error.',
  },

  // Request errors
  [ErrorCode.RequestTooLarge]: {
    error: 'Request body too large.',
  },
  [ErrorCode.InvalidContentLength]: {
    error: 'Invalid Content-Length header.',
  },
  [ErrorCode.ContentLengthMismatch]: {
    error: 'Content-Length header does not match actual body size.',
  },
  [ErrorCode.BadRequest]: {
    error: 'Bad request.',
  },
}

export default ErrorRegistry
