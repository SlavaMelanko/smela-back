import { z } from 'zod'

import { TOKEN_LENGTH } from '../../token'
import { withVariants } from '../helper'

const rules = {
  token: withVariants(
    z.string().length(
      TOKEN_LENGTH,
      `Token must be exactly ${TOKEN_LENGTH} characters long`,
    ),
  ),
  captchaToken: withVariants(
    z.string()
      .min(1, 'reCAPTCHA token is required')
      .min(20, 'reCAPTCHA token is too short')
      .max(2000, 'reCAPTCHA token is too long')
      .regex(/^[\w-]+$/, 'reCAPTCHA token contains invalid characters'),
  ),
}

export default rules
