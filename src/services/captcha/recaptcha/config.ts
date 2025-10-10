import env from '@/env'

import type { Config } from '../config'

export const recaptchaConfig: Config = {
  baseUrl: 'https://www.google.com',
  path: '/recaptcha/api/siteverify',
  options: {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    timeout: 5000,
  },
  secret: env.CAPTCHA_SECRET_KEY,
}
