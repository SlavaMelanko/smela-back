import { z } from 'zod'

export const captchaEnvVars = {
  // reCAPTCHA configuration
  CAPTCHA_SECRET_KEY: z.string().regex(/^[\w-]{40}$/, 'Invalid reCAPTCHA secret key format'),
}
