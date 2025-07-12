import type ErrorCode from './codes'

class AppError extends Error {
  code: ErrorCode

  constructor(code: ErrorCode, message?: string) {
    super(message)
    this.code = code
    this.name = 'AppError'
  }
}

export default AppError
