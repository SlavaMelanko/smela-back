import type { MiddlewareHandler } from 'hono'

import { createMiddleware } from 'hono/factory'

import type { AppContext } from '@/context'

import { AppError, ErrorCode } from '@/errors'
import { createCaptchaVerifier } from '@/services'

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
  const captchaVerifier = createCaptchaVerifier()

  return createMiddleware<AppContext>(async (c, next) => {
    try {
      // At this point, the request has already been validated by requestValidator
      // So we know captchaToken exists and is properly formatted
      const { captchaToken } = await c.req.json<CaptchaRequestBody>()

      await captchaVerifier.validate(captchaToken)
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }

      throw new AppError(ErrorCode.CaptchaValidationFailed)
    }

    await next()
  })
}

export default captchaMiddleware
