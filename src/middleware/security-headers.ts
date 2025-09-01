import type { MiddlewareHandler } from 'hono'

import { secureHeaders } from 'hono/secure-headers'

import { isDevEnv, isProdEnv, isStagingEnv } from '@/lib/env'

const getSecurityHeadersConfig = () => {
  // Build CSP configuration object.
  const devCsp = {
    defaultSrc: ['\'self\''],
    scriptSrc: ['\'self\'', '\'unsafe-inline\'', '\'unsafe-eval\''], // allow eval in dev for HMR
    styleSrc: ['\'self\'', '\'unsafe-inline\''], // allow inline styles for better compatibility
    imgSrc: ['\'self\'', 'data:', 'https:', 'http:'], // allow http images in dev
    fontSrc: ['\'self\''],
    connectSrc: ['\'self\''],
    frameAncestors: ['\'none\''],
    baseUri: ['\'self\''],
    formAction: ['\'self\''],
  }

  const prodCsp = {
    defaultSrc: ['\'self\''],
    scriptSrc: ['\'self\''], // strict script-src
    styleSrc: ['\'self\'', '\'unsafe-inline\''], // allow inline styles for better compatibility
    imgSrc: ['\'self\'', 'data:', 'https:'],
    fontSrc: ['\'self\''],
    connectSrc: ['\'self\''],
    frameAncestors: ['\'none\''],
    baseUri: ['\'self\''],
    formAction: ['\'self\''],
    upgradeInsecureRequests: [],
  }

  // Build configuration object.
  const config: Parameters<typeof secureHeaders>[0] = {
    xContentTypeOptions: 'nosniff',
    xFrameOptions: 'DENY',
    xXssProtection: '1; mode=block',
    referrerPolicy: 'strict-origin-when-cross-origin',
    contentSecurityPolicy: isDevEnv() ? devCsp : prodCsp,
    permissionsPolicy: {
      geolocation: [],
      camera: [],
      microphone: [],
      payment: [],
      usb: [],
      magnetometer: [],
      gyroscope: [],
      accelerometer: [],
    },
    // Add Strict-Transport-Security for production/staging.
    strictTransportSecurity: (isProdEnv() || isStagingEnv())
      ? 'max-age=31536000; includeSubDomains; preload'
      : undefined,
  }

  return config
}

const securityHeadersMiddleware: MiddlewareHandler = secureHeaders(getSecurityHeadersConfig())

export default securityHeadersMiddleware
