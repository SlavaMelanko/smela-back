import { isDevOrTestEnv, isStagingOrProdEnv } from '@/env'

const getCommonCsp = () => ({
  defaultSrc: ['\'self\''],
  fontSrc: ['\'self\''],
  connectSrc: ['\'self\''],
  mediaSrc: ['\'self\''],
  objectSrc: ['\'none\''],
  manifestSrc: ['\'self\''],
  frameAncestors: ['\'none\''],
  baseUri: ['\'self\''],
  formAction: ['\'self\''],
})

const getDevAndTestCsp = () => ({
  ...getCommonCsp(),
  scriptSrc: ['\'self\'', '\'unsafe-inline\'', '\'unsafe-eval\''], // allow eval in dev for HMR
  styleSrc: ['\'self\'', '\'unsafe-inline\''], // allow inline styles for better compatibility
  imgSrc: ['\'self\'', 'data:', 'https:', 'http:'], // allow http images in dev
})

const getStagingAndProdCsp = () => ({
  ...getCommonCsp(),
  scriptSrc: ['\'self\''], // strict script-src
  styleSrc: ['\'self\'', '\'unsafe-inline\''], // allow inline styles for better compatibility
  imgSrc: ['\'self\'', 'data:', 'https:'],
  upgradeInsecureRequests: [],
})

const getCsp = () => (isDevOrTestEnv() ? getDevAndTestCsp() : getStagingAndProdCsp())

const getStrictTransportSecurity = () => {
  const oneYearInSeconds = 31536000

  return isStagingOrProdEnv()
    ? `max-age=${oneYearInSeconds}; includeSubDomains; preload`
    : undefined
}

export const createSecureHeadersConfig = () => ({
  xContentTypeOptions: 'nosniff' as const,
  xFrameOptions: 'DENY' as const,
  referrerPolicy: 'strict-origin-when-cross-origin' as const,
  contentSecurityPolicy: getCsp(),
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
  strictTransportSecurity: getStrictTransportSecurity(),
})
