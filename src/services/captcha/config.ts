/**
 * Generic CAPTCHA configuration interface.
 *
 * This can be extended by specific CAPTCHA providers
 * (reCAPTCHA, hCaptcha, Cloudflare Turnstile, etc.).
 */
export interface Config {
  baseUrl: string
  path: string
  headers: Record<string, string>
  secret: string
}
