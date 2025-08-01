import { cors } from 'hono/cors'

import env, { isDevOrTestEnv } from '@/lib/env'

const corsMiddleware = cors({
  origin: (origin: string) => {
    // In development, allow all origins
    if (isDevOrTestEnv()) {
      return origin
    }

    // In production, check against allowed origins
    const allowedOrigins = env.ALLOWED_ORIGINS?.split(',') || []

    return allowedOrigins.includes(origin) ? origin : undefined
  },
  credentials: true, // Allow cookies to be sent
})

export default corsMiddleware
