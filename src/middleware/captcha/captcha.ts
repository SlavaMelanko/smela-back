import type { MiddlewareHandler } from 'hono'

import { createMiddleware } from 'hono/factory'

import type { AppContext } from '@/context'

import { AppError, ErrorCode } from '@/errors'
import { createCaptchaVerifier } from '@/services'

interface CaptchaBody {
  captcha: {
    token: string
  }
}

interface CaptchaInput {
  in: { json: CaptchaBody }
  out: { json: CaptchaBody }
}

/**
 * CAPTCHA validation middleware for protecting auth endpoints from bot attacks.
 *
 * Validates CAPTCHA token from request body using the CAPTCHA service.
 * Should be applied after request validation but before the main handler.
 *
 * Expects `captcha.token` to be present in the validated request body.
 */
const captchaMiddleware = (): MiddlewareHandler<AppContext> => {
  const captchaVerifier = createCaptchaVerifier()

  return createMiddleware<AppContext, string, CaptchaInput>(async (c, next) => {
    try {
      // Uses validated data from upstream validator
      const { captcha } = c.req.valid('json')

      await captchaVerifier.validate(captcha.token)
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
