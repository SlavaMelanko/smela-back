import type { ValidationTargets } from 'hono'
import type { ZodSchema } from 'zod'

import { zValidator } from '@hono/zod-validator'

import { AppError, ErrorCode } from '../errors'

const requestValidator = <T extends ZodSchema, Target extends keyof ValidationTargets>(
  target: Target,
  schema: T,
) =>
  zValidator(target, schema, (result, _c) => {
    if (!result.success) {
      const firstIssue = result.error.issues[0]

      const message = firstIssue?.message || 'Validation failed'

      throw new AppError(ErrorCode.ValidationError, message)
    }
  })

export default requestValidator
