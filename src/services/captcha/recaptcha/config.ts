import env from '@/lib/env'

import type { Config } from '../config'

export const recaptchaConfig: Config = {
  baseUrl: 'https://www.google.com',
  path: '/recaptcha/api/siteverify',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  secret: env.CAPTCHA_SECRET_KEY,
}
