import type { ValidationTargets } from 'hono'
import type { ZodIssue, ZodSchema } from 'zod'

import { zValidator } from '@hono/zod-validator'

import { AppError, ErrorCode } from '@/errors'
import { logger } from '@/logging'

const makeErrorMessage = (issues: ZodIssue[]): string => {
  const firstIssue = issues[0]
  const errorMessage = firstIssue?.message || 'Invalid request'
  const fieldName = firstIssue?.path.join('.')

  if (errorMessage === 'Required') {
    return `"${fieldName}" is required`
  }

  return `[${fieldName}]: ${errorMessage.toLowerCase()}`
}

const requestValidator = <Target extends keyof ValidationTargets, Schema extends ZodSchema>(
  target: Target,
  schema: Schema,
) =>
  zValidator(target, schema, (result, _c) => {
    if (!result.success) {
      const issues = result.error.issues as ZodIssue[]

      logger.error(issues)

      const message = makeErrorMessage(issues)

      throw new AppError(ErrorCode.ValidationError, message)
    }
  })

export default requestValidator
