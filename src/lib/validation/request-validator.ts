import type { ValidationTargets } from 'hono'
import type { ZodSchema } from 'zod'

import { zValidator } from '@hono/zod-validator'

import { AppError, ErrorCode } from '../catch'

const makeErrorMessage = (issues: Array<{ message: string, path: (string | number)[] }>): string => {
  const firstIssue = issues[0]
  const errorMessage = firstIssue?.message || 'Invalid request'

  if (errorMessage === 'Required') {
    const fieldName = firstIssue?.path.join('.')

    return `Missing required field "${fieldName}"`
  }

  return errorMessage
}

const requestValidator = <T extends ZodSchema, Target extends keyof ValidationTargets>(
  target: Target,
  schema: T,
) =>
  zValidator(target, schema, (result, _c) => {
    if (!result.success) {
      const message = makeErrorMessage(result.error.issues)

      throw new AppError(ErrorCode.ValidationError, message)
    }
  })

export default requestValidator
