import { StatusCodes } from 'http-status-codes'

import ErrorCode from './codes'

interface ErrorDetails {
  status: StatusCodes
  error: string
}

const ErrorRegistry: Record<ErrorCode, ErrorDetails> = {
  // Auth errors
  [ErrorCode.AlreadyVerified]: {
    status: StatusCodes.BAD_REQUEST,
    error: 'User is already verified.',
  },
  [ErrorCode.BadCredentials]: {
    status: StatusCodes.UNAUTHORIZED,
    error: 'Invalid email or password.',
  },
  [ErrorCode.EmailAlreadyInUse]: {
    status: StatusCodes.CONFLICT,
    error: 'Email is already in use.',
  },
  [ErrorCode.Forbidden]: {
    status: StatusCodes.FORBIDDEN,
    error: 'Unverified account.',
  },
  [ErrorCode.InvalidCredentials]: {
    status: StatusCodes.UNAUTHORIZED,
    error: 'Invalid credentials.',
  },
  [ErrorCode.Unauthorized]: {
    status: StatusCodes.UNAUTHORIZED,
    error: 'Unauthorized access.',
  },

  // Token errors
  [ErrorCode.TokenAlreadyUsed]: {
    status: StatusCodes.BAD_REQUEST,
    error: 'Token has already been used.',
  },
  [ErrorCode.TokenDeprecated]: {
    status: StatusCodes.GONE,
    error: 'Token has been deprecated.',
  },
  [ErrorCode.TokenExpired]: {
    status: StatusCodes.UNAUTHORIZED,
    error: 'Token has expired.',
  },
  [ErrorCode.TokenNotFound]: {
    status: StatusCodes.BAD_REQUEST,
    error: 'Token not found.',
  },
  [ErrorCode.TokenTypeMismatch]: {
    status: StatusCodes.BAD_REQUEST,
    error: 'Token type mismatch.',
  },

  // Captcha errors
  [ErrorCode.CaptchaInvalidToken]: {
    status: StatusCodes.BAD_REQUEST,
    error: 'Invalid reCAPTCHA token.',
  },
  [ErrorCode.CaptchaTokenMissing]: {
    status: StatusCodes.BAD_REQUEST,
    error: 'reCAPTCHA token is required.',
  },
  [ErrorCode.CaptchaValidationFailed]: {
    status: StatusCodes.BAD_REQUEST,
    error: 'reCAPTCHA token validation failed.',
  },

  // System errors
  [ErrorCode.InternalError]: {
    status: StatusCodes.INTERNAL_SERVER_ERROR,
    error: 'Internal server error.',
  },
  [ErrorCode.NotFound]: {
    status: StatusCodes.NOT_FOUND,
    error: 'Resource not found.',
  },
  [ErrorCode.ValidationError]: {
    status: StatusCodes.BAD_REQUEST,
    error: 'Validation error.',
  },

  // Request errors
  [ErrorCode.RequestTooLarge]: {
    status: StatusCodes.REQUEST_TOO_LONG,
    error: 'Request body too large.',
  },
  [ErrorCode.InvalidContentLength]: {
    status: StatusCodes.BAD_REQUEST,
    error: 'Invalid Content-Length header.',
  },
  [ErrorCode.ContentLengthMismatch]: {
    status: StatusCodes.BAD_REQUEST,
    error: 'Content-Length header does not match actual body size.',
  },
}

export default ErrorRegistry
