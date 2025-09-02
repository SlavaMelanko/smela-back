import type { MiddlewareHandler } from 'hono'

import { secureHeaders } from 'hono/secure-headers'

import { isDevEnv, isStagingOrProdEnv } from '@/lib/env'

const getSecurityHeadersConfig = () => {
  const commonCsp = {
    defaultSrc: ['\'self\''],
    fontSrc: ['\'self\''],
    connectSrc: ['\'self\''],
    mediaSrc: ['\'self\''],
    objectSrc: ['\'none\''],
    manifestSrc: ['\'self\''],
    frameAncestors: ['\'none\''],
    baseUri: ['\'self\''],
    formAction: ['\'self\''],
  }

  const devCsp = {
    ...commonCsp,
    scriptSrc: ['\'self\'', '\'unsafe-inline\'', '\'unsafe-eval\''], // allow eval in dev for HMR
    styleSrc: ['\'self\'', '\'unsafe-inline\''], // allow inline styles for better compatibility
    imgSrc: ['\'self\'', 'data:', 'https:', 'http:'], // allow http images in dev
  }

  const prodCsp = {
    ...commonCsp,
    scriptSrc: ['\'self\''], // strict script-src
    styleSrc: ['\'self\'', '\'unsafe-inline\''], // allow inline styles for better compatibility
    imgSrc: ['\'self\'', 'data:', 'https:'],
    upgradeInsecureRequests: [],
  }

  const config: Parameters<typeof secureHeaders>[0] = {
    xContentTypeOptions: 'nosniff',
    xFrameOptions: 'DENY',
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
    strictTransportSecurity: isStagingOrProdEnv()
      ? 'max-age=31536000; includeSubDomains; preload'
      : undefined,
  }

  return config
}

const securityHeadersMiddleware: MiddlewareHandler = secureHeaders(getSecurityHeadersConfig())

export default securityHeadersMiddleware
