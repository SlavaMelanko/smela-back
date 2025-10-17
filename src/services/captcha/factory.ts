import type { Captcha } from './captcha'

import { Recaptcha, recaptchaConfig } from './recaptcha/'

/**
 * Factory function to create a CAPTCHA verification service instance.
 *
 * Currently returns a Google reCAPTCHA verifier, but can be extended
 * to support different CAPTCHA providers based on configuration.
 *
 * @returns {Captcha} CAPTCHA verification service instance.
 */
export const createCaptchaVerifier = (): Captcha => {
  return new Recaptcha(recaptchaConfig)
}
