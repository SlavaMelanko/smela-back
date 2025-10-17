import type ErrorCode from './codes'

import ErrorRegistry from './registry'

export const APP_ERROR_NAME = 'AppError'

class AppError extends Error {
  code: ErrorCode

  constructor(code: ErrorCode, message?: string) {
    super(message ?? ErrorRegistry[code].error)
    this.code = code
    this.name = APP_ERROR_NAME
  }
}

export default AppError
