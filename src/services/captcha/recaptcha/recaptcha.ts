import { AppError, ErrorCode } from '@/errors'
import { HttpClient } from '@/net/http/client'

import type { Captcha } from '../captcha'
import type { Config } from '../config'
import type { Result } from './result'

/**
 * Google reCAPTCHA v2 (invisible) verification service.
 *
 * Implements the Captcha interface for Google's reCAPTCHA service.
 */
export class Recaptcha implements Captcha {
  private httpClient: HttpClient
  private config: Config

  constructor(config: Config) {
    this.config = config
    this.httpClient = new HttpClient(
      config.baseUrl,
      config.options,
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
    const result = await this.httpClient.post<Result>(this.config.path, body)

    if (!result.success) {
      const errorCodes = result['error-codes'] || []
      const hostname = result.hostname || 'unknown'
      const message = `reCAPTCHA token validation failed. Error codes: ${errorCodes.join(', ')}. Hostname: ${hostname}`

      throw new AppError(ErrorCode.CaptchaValidationFailed, message)
    }
  }
}
