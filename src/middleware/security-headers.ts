import type { MiddlewareHandler } from 'hono'

import { isDevEnv, isProdEnv, isStagingEnv } from '@/lib/env'

const securityHeadersMiddleware: MiddlewareHandler = async (c, next) => {
  await next()

  // Prevent MIME type sniffing.
  c.header('X-Content-Type-Options', 'nosniff')

  // Prevent clickjacking attacks.
  c.header('X-Frame-Options', 'DENY')

  // Enable XSS protection (legacy browsers).
  c.header('X-XSS-Protection', '1; mode=block')

  // Control referrer information.
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Enforce HTTPS in production/staging.
  if (isProdEnv() || isStagingEnv()) {
    c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  }

  // Content Security Policy.
  const cspDirectives = [
    'default-src \'self\'',
    'script-src \'self\'',
    'style-src \'self\' \'unsafe-inline\'', // allow inline styles for better compatibility
    'img-src \'self\' data: https:',
    'font-src \'self\'',
    'connect-src \'self\'',
    'frame-ancestors \'none\'',
    'base-uri \'self\'',
    'form-action \'self\'',
    'upgrade-insecure-requests',
  ]

  // Relax CSP in development.
  if (isDevEnv()) {
    cspDirectives[1] = 'script-src \'self\' \'unsafe-inline\' \'unsafe-eval\'' // allow eval in dev for HMR
    cspDirectives[3] = 'img-src \'self\' data: https: http:' // allow http images in dev
  }

  c.header('Content-Security-Policy', cspDirectives.join('; '))

  // Permissions Policy (formerly Feature Policy).
  c.header(
    'Permissions-Policy',
    'geolocation=(), camera=(), microphone=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()',
  )
}

export default securityHeadersMiddleware
