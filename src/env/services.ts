import { z } from 'zod'

export const captchaEnvVars = {
  CAPTCHA_SECRET_KEY: z.string().regex(/^[\w-]{40}$/, 'Invalid reCAPTCHA secret key format'),
}

export const sentryEnvVars = {
  SENTRY_DSN: z.string().url().optional(),
}
