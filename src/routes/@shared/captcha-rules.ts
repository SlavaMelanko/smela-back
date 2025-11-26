import { z } from 'zod'

export const captchaRules = {
  token: z.string()
    .min(1, 'reCAPTCHA token is required')
    .min(20, 'reCAPTCHA token is too short')
    .max(2000, 'reCAPTCHA token is too long')
    .regex(/^[\w-]+$/, 'reCAPTCHA token contains invalid characters'),
}
