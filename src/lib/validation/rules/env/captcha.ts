import { z } from 'zod'

const rules = {
  // reCAPTCHA configuration
  captchaSecretKey: z.string().regex(/^[\w-]{40}$/, 'Invalid reCAPTCHA secret key format'),
}

export default rules
