export const isLocalhost = (origin: string): boolean => {
  const localhostPatterns = [
    /^http:\/\/localhost(:\d+)?$/,
    /^http:\/\/127\.0\.0\.1(:\d+)?$/,
    /^http:\/\/\[::1\](:\d+)?$/,
    /^https:\/\/localhost(:\d+)?$/,
  ]

  return localhostPatterns.some(pattern => pattern.test(origin))
}

export const isHTTPS = (url: string): boolean => {
  return url.startsWith('https://')
}

export const parseOrigin = (origin: string): URL | null => {
  try {
    return new URL(origin)
  } catch {
    return null
  }
}

export const normalizeOrigin = (origin: string): string => {
  const parsed = parseOrigin(origin.trim())
  if (!parsed) {
    return origin.trim()
  }

  // Return origin without path, just protocol + host + port
  return parsed.origin.toLowerCase()
}

export const isValidOrigin = (origin: string): boolean => {
  return parseOrigin(origin) !== null
}
