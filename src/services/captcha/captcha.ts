/**
 * Interface for CAPTCHA validation services.
 *
 * Provides a contract for different CAPTCHA implementations
 * (Google reCAPTCHA, hCaptcha, Cloudflare Turnstile, etc.).
 */
export interface Captcha {
  /**
   * Validates a CAPTCHA token.
   *
   * @param token - The CAPTCHA token to validate.
   * @throws {AppError} When token is invalid or validation fails.
   * @returns Promise that resolves when validation succeeds.
   */
  validate: (token: string) => Promise<void>
}
