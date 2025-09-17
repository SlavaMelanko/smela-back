import { ApiClient } from '@/lib/api-client'
import AppError from '@/lib/catch/app-error'
import ErrorCode from '@/lib/catch/codes'
import logger from '@/lib/logger'

import type { Config } from './config'
import type { Response } from './response'

// Google reCAPTCHA v2 (invisible) verification service.
export class Recaptcha {
  private apiClient: ApiClient
  private config: Config

  constructor(config: Config) {
    this.config = config
    this.apiClient = new ApiClient(
      config.baseUrl,
      config.headers,
    )
  }

  private createBody(token: string): URLSearchParams {
    return new URLSearchParams({
      secret: this.config.secret,
      response: token,
    })
  }

  async validate(token: string): Promise<void> {
    if (!token || typeof token !== 'string') {
      throw new AppError(ErrorCode.CaptchaInvalidToken)
    }

    const body = this.createBody(token)
    const data = await this.apiClient.post<Response>(this.config.path, body)

    if (!data.success) {
      logger.warn({ data }, 'reCAPTCHA token validation failed')

      const errorCodes = data['error-codes'] || []
      const hostname = data.hostname || 'unknown'
      const message = `reCAPTCHA token validation failed. Error codes: ${errorCodes.join(', ')}. Hostname: ${hostname}`

      throw new AppError(ErrorCode.CaptchaValidationFailed, message)
    }

    logger.debug({ data }, 'reCAPTCHA token validated successfully')
  }
}
