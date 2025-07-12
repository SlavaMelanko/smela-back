import { StatusCodes } from 'http-status-codes'

import ErrorCode from './codes'

interface ErrorDetails {
  status: StatusCodes
  error: string
}

const ErrorRegistry: Record<ErrorCode, ErrorDetails> = {
  [ErrorCode.Unauthorized]: {
    status: StatusCodes.UNAUTHORIZED,
    error: 'Unauthorized access',
  },
  [ErrorCode.BadCredentials]: {
    status: StatusCodes.UNAUTHORIZED,
    error: 'Invalid email or password',
  },
  [ErrorCode.EmailAlreadyInUse]: {
    status: StatusCodes.CONFLICT,
    error: 'Email is already in use',
  },
  [ErrorCode.Forbidden]: {
    status: StatusCodes.FORBIDDEN,
    error: 'Unverified account',
  },
  [ErrorCode.TokenExpired]: {
    status: StatusCodes.UNAUTHORIZED,
    error: 'Token has expired',
  },
  [ErrorCode.TokenNotFound]: {
    status: StatusCodes.NOT_FOUND,
    error: 'Token not found',
  },
  [ErrorCode.TokenAlreadyUsed]: {
    status: StatusCodes.BAD_REQUEST,
    error: 'Token has already been used',
  },
  [ErrorCode.TokenDeprecated]: {
    status: StatusCodes.GONE,
    error: 'Token has been deprecated',
  },
  [ErrorCode.TokenTypeMismatch]: {
    status: StatusCodes.BAD_REQUEST,
    error: 'Token type mismatch',
  },
  [ErrorCode.NotFound]: {
    status: StatusCodes.NOT_FOUND,
    error: 'Resource not found',
  },
  [ErrorCode.ValidationError]: {
    status: StatusCodes.BAD_REQUEST,
    error: 'Validation error',
  },
  [ErrorCode.InternalError]: {
    status: StatusCodes.INTERNAL_SERVER_ERROR,
    error: 'Internal server error',
  },
}

export default ErrorRegistry
