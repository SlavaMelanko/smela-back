import { describe, expect, test } from 'bun:test'

import AppError, { APP_ERROR_NAME } from '../app-error'
import ErrorCode from '../codes'
import ErrorRegistry from '../registry'

describe('AppError', () => {
  test('should create AppError with correct code, name, and message from ErrorRegistry', () => {
    const errorCodes = Object.values(ErrorCode)

    for (const code of errorCodes) {
      const error = new AppError(code)

      expect(error.code).toBe(code)
      expect(error.name).toBe(APP_ERROR_NAME)
      expect(error.message).toBe(ErrorRegistry[code].error)
    }
  })

  test('should create AppError with custom message that overrides ErrorRegistry', () => {
    const customMessage = 'Custom error message for testing'
    const error = new AppError(ErrorCode.BadCredentials, customMessage)

    expect(error.code).toBe(ErrorCode.BadCredentials)
    expect(error.name).toBe(APP_ERROR_NAME)
    expect(error.message).toBe(customMessage)
  })
})
