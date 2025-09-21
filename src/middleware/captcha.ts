import type { MiddlewareHandler } from 'hono'

import { createCaptcha } from '@/services'

/**
 * CAPTCHA validation middleware for protecting auth endpoints from bot attacks.
 *
 * Validates CAPTCHA token from request body using the CAPTCHA service.
 * Should be applied after request validation but before the main handler.
 *
 * Expects `captchaToken` to be present in the validated request body.
 */
const captchaMiddleware = (): MiddlewareHandler => {
  const captcha = createCaptcha()

  return async (c, next) => {
    // At this point, the request has already been validated by requestValidator
    // so we know captchaToken exists and is properly formatted.
    const { captchaToken } = await c.req.json()

    await captcha.validate(captchaToken)

    await next()
  }
}

export default captchaMiddleware
