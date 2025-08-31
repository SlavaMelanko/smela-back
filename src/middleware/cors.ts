import { cors } from 'hono/cors'

import env, { isDevEnv, isProdEnv, isStagingEnv, isTestEnv } from '@/lib/env'

/**
 * CORS Configuration by Environment:
 * - Development: Allow common localhost ports for development
 * - Test: Allow all origins but with minimal configuration
 * - Staging/Production: Strict origin validation with explicit allowed origins
 */
const getCorsConfig = () => {
  // Test environment: Minimal CORS for unit tests
  if (isTestEnv()) {
    return cors({
      origin: '*', // Allow all origins in test
      credentials: false, // No credentials in test
    })
  }

  // Development environment: Allow common development origins
  if (isDevEnv()) {
    return cors({
      origin: (origin: string) => {
        // Allow requests without origin (e.g., Postman, curl)
        if (!origin)
          return '*'

        // Allow common localhost ports
        const allowedPatterns = [
          /^http:\/\/localhost(:\d+)?$/,
          /^http:\/\/127\.0\.0\.1(:\d+)?$/,
          /^http:\/\/\[::1\](:\d+)?$/,
          /^https:\/\/localhost(:\d+)?$/,
        ]

        const isAllowed = allowedPatterns.some(pattern => pattern.test(origin))

        return isAllowed ? origin : undefined
      },
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      exposeHeaders: ['Content-Length', 'X-Request-Id'],
      maxAge: 600, // Cache preflight for 10 minutes in dev
      credentials: true,
    })
  }

  // Staging/Production environment: Strict CORS
  if (isStagingEnv() || isProdEnv()) {
    const allowedOrigins = env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()).filter(Boolean) || []

    // Fail closed: If no origins configured, deny all
    if (allowedOrigins.length === 0) {
      console.warn('⚠️ CORS Warning: No ALLOWED_ORIGINS configured for production/staging')
    }

    return cors({
      origin: (origin: string) => {
        // Deny requests without origin in production
        if (!origin)
          return undefined

        // Check against allowed origins list
        return allowedOrigins.includes(origin) ? origin : undefined
      },
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      exposeHeaders: ['Content-Length', 'X-Request-Id'],
      maxAge: 3600, // Cache preflight for 1 hour in production
      credentials: true,
    })
  }

  // Default fallback (should never reach here)
  return cors({
    origin: () => undefined, // Deny all by default
    credentials: false,
  })
}

const corsMiddleware = getCorsConfig()

export default corsMiddleware
