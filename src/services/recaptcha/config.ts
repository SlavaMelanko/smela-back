import env from '@/lib/env'

export interface Config {
  baseUrl: string
  path: string
  headers: Record<string, string>
  secret: string
}

export const config: Config = {
  baseUrl: 'https://www.google.com',
  path: '/recaptcha/api/siteverify',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  secret: env.CAPTCHA_SECRET_KEY,
}
