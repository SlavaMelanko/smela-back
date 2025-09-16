import { ApiClient } from '@/lib/api-client'
import AppError from '@/lib/catch/app-error'
import ErrorCode from '@/lib/catch/codes'
import env from '@/lib/env'
import logger from '@/lib/logger'

import type { Response } from './response'

// Google reCAPTCHA v2 (invisible) verification service.
export class Recaptcha {
  private apiClient: ApiClient

  constructor() {
    this.apiClient = new ApiClient(
      'https://www.google.com/recaptcha/api',
      {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    )
  }

  private createBody(token: string): URLSearchParams {
    return new URLSearchParams({
      secret: env.CAPTCHA_SECRET_KEY,
      response: token,
    })
  }

  async validate(token: string): Promise<void> {
    if (!token || typeof token !== 'string') {
      throw new AppError(ErrorCode.CaptchaInvalidToken)
    }

    const body = this.createBody(token)
    const data = await this.apiClient.post<Response>('/siteverify', body)

    if (!data.success) {
      const errorCodes = data['error-codes'] || []
      const hostname = data.hostname || 'unknown'
      const message = `reCAPTCHA token validation failed. Error codes: ${errorCodes.join(', ')}. Hostname: ${hostname}`

      logger.warn({
        errorCodes,
        hostname: data.hostname,
      }, 'reCAPTCHA token validation failed')

      throw new AppError(ErrorCode.CaptchaValidationFailed, message)
    }

    logger.debug({
      hostname: data.hostname,
      challengeTs: data.challenge_ts,
    }, 'reCAPTCHA token validated successfully')
  }
}
