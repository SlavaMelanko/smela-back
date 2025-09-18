import type { Captcha } from './captcha'

import { Recaptcha, recaptchaConfig } from './recaptcha/'

/**
 * Factory function to create a CAPTCHA service instance.
 *
 * Currently returns a Google reCAPTCHA implementation, but can be extended
 * to support different CAPTCHA providers based on configuration.
 *
 * @returns {Captcha} CAPTCHA service instance.
 */
export const createCaptcha = (): Captcha => {
  return new Recaptcha(recaptchaConfig)
}
