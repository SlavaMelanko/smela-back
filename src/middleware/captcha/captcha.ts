import type { MiddlewareHandler } from 'hono'

import { createMiddleware } from 'hono/factory'

import type { AppContext } from '@/context'

import { AppError, ErrorCode } from '@/lib/catch'
import logger from '@/lib/logger'
import { createCaptcha } from '@/services'

interface CaptchaRequestBody {
  captchaToken: string
}

/**
 * CAPTCHA validation middleware for protecting auth endpoints from bot attacks.
 *
 * Validates CAPTCHA token from request body using the CAPTCHA service.
 * Should be applied after request validation but before the main handler.
 *
 * Expects `captchaToken` to be present in the validated request body.
 */
const captchaMiddleware = (): MiddlewareHandler<AppContext> => {
  const captcha = createCaptcha()

  return createMiddleware<AppContext>(async (c, next) => {
    try {
      // At this point, the request has already been validated by requestValidator
      // So we know captchaToken exists and is properly formatted
      const { captchaToken } = await c.req.json<CaptchaRequestBody>()

      await captcha.validate(captchaToken)
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }

      logger.error({
        error,
        path: c.req.path,
        method: c.req.method,
      }, 'Unexpected error during CAPTCHA validation')

      throw new AppError(ErrorCode.CaptchaValidationFailed)
    }

    await next()
  })
}

export default captchaMiddleware
