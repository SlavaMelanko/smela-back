/**
 * Generic CAPTCHA configuration interface.
 *
 * This can be extended by specific CAPTCHA providers
 * (reCAPTCHA, hCaptcha, Cloudflare Turnstile, etc.).
 */
export interface Config {
  baseUrl: string
  path: string
  options: {
    headers: Record<string, string>
    timeout: number
  }
  secret: string
}
