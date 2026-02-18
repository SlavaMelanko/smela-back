import type { ValidationTargets } from 'hono'
import type { ZodType } from 'zod'

import { zValidator } from '@hono/zod-validator'

import { AppError, ErrorCode } from '@/errors'
import { logger } from '@/logging'

export const requestValidator = <Target extends keyof ValidationTargets, Schema extends ZodType>(
  target: Target,
  schema: Schema,
) =>
  zValidator(target, schema, (result, _c) => {
    if (!result.success) {
      const { issues } = result.error

      logger.error(issues)

      throw new AppError(ErrorCode.ValidationError, JSON.stringify(issues))
    }
  })
