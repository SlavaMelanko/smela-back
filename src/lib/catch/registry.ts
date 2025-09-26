import HttpStatus from '@/lib/http-status'

import ErrorCode from './codes'

interface ErrorDetails {
  status: HttpStatus
  error: string
}

const ErrorRegistry: Record<ErrorCode, ErrorDetails> = {
  // Auth errors
  [ErrorCode.AlreadyVerified]: {
    status: HttpStatus.BAD_REQUEST,
    error: 'User is already verified.',
  },
  [ErrorCode.BadCredentials]: {
    status: HttpStatus.UNAUTHORIZED,
    error: 'Invalid email or password.',
  },
  [ErrorCode.EmailAlreadyInUse]: {
    status: HttpStatus.CONFLICT,
    error: 'Email is already in use.',
  },
  [ErrorCode.Forbidden]: {
    status: HttpStatus.FORBIDDEN,
    error: 'Unverified account.',
  },
  [ErrorCode.InvalidCredentials]: {
    status: HttpStatus.UNAUTHORIZED,
    error: 'Invalid credentials.',
  },
  [ErrorCode.Unauthorized]: {
    status: HttpStatus.UNAUTHORIZED,
    error: 'Unauthorized access.',
  },

  // Token errors
  [ErrorCode.TokenAlreadyUsed]: {
    status: HttpStatus.BAD_REQUEST,
    error: 'Token has already been used.',
  },
  [ErrorCode.TokenDeprecated]: {
    status: HttpStatus.GONE,
    error: 'Token has been deprecated.',
  },
  [ErrorCode.TokenExpired]: {
    status: HttpStatus.UNAUTHORIZED,
    error: 'Token has expired.',
  },
  [ErrorCode.TokenNotFound]: {
    status: HttpStatus.BAD_REQUEST,
    error: 'Token not found.',
  },
  [ErrorCode.TokenTypeMismatch]: {
    status: HttpStatus.BAD_REQUEST,
    error: 'Token type mismatch.',
  },

  // Captcha errors
  [ErrorCode.CaptchaInvalidToken]: {
    status: HttpStatus.BAD_REQUEST,
    error: 'Invalid reCAPTCHA token.',
  },
  [ErrorCode.CaptchaValidationFailed]: {
    status: HttpStatus.BAD_REQUEST,
    error: 'reCAPTCHA token validation failed.',
  },

  // System errors
  [ErrorCode.InternalError]: {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    error: 'Internal server error.',
  },
  [ErrorCode.NotFound]: {
    status: HttpStatus.NOT_FOUND,
    error: 'Resource not found.',
  },
  [ErrorCode.ValidationError]: {
    status: HttpStatus.BAD_REQUEST,
    error: 'Validation error.',
  },

  // Request errors
  [ErrorCode.RequestTooLarge]: {
    status: HttpStatus.REQUEST_TOO_LONG,
    error: 'Request body too large.',
  },
  [ErrorCode.InvalidContentLength]: {
    status: HttpStatus.BAD_REQUEST,
    error: 'Invalid Content-Length header.',
  },
  [ErrorCode.ContentLengthMismatch]: {
    status: HttpStatus.BAD_REQUEST,
    error: 'Content-Length header does not match actual body size.',
  },
  [ErrorCode.BadRequest]: {
    status: HttpStatus.BAD_REQUEST,
    error: 'Bad request.',
  },
}

export default ErrorRegistry
