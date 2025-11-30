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

  test('should handle undefined custom message', () => {
    const error = new AppError(ErrorCode.InvalidCredentials, undefined)

    expect(error.code).toBe(ErrorCode.InvalidCredentials)
    expect(error.name).toBe(APP_ERROR_NAME)
    expect(error.message).toBe(ErrorRegistry[ErrorCode.InvalidCredentials].error)
  })

  test('should handle null custom message', () => {
    // @ts-expect-error - testing invalid input
    const error = new AppError(ErrorCode.InvalidCredentials, null)

    expect(error.code).toBe(ErrorCode.InvalidCredentials)
    expect(error.name).toBe(APP_ERROR_NAME)
    expect(error.message).toBe(ErrorRegistry[ErrorCode.InvalidCredentials].error)
  })

  test('should handle empty string custom message', () => {
    const error = new AppError(ErrorCode.InvalidCredentials, '')

    expect(error.code).toBe(ErrorCode.InvalidCredentials)
    expect(error.name).toBe(APP_ERROR_NAME)
    expect(error.message).toBe(ErrorRegistry[ErrorCode.InvalidCredentials].error)
  })

  test('should handle whitespace-only custom message', () => {
    const error = new AppError(ErrorCode.InvalidCredentials, '   ')

    expect(error.code).toBe(ErrorCode.InvalidCredentials)
    expect(error.name).toBe(APP_ERROR_NAME)
    expect(error.message).toBe(ErrorRegistry[ErrorCode.InvalidCredentials].error)
  })

  test('should create AppError with custom message that overrides ErrorRegistry', () => {
    const customMessage = 'Custom error message for testing'
    const error = new AppError(ErrorCode.InvalidCredentials, customMessage)

    expect(error.code).toBe(ErrorCode.InvalidCredentials)
    expect(error.name).toBe(APP_ERROR_NAME)
    expect(error.message).toBe(customMessage)
  })
})
