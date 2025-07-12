// Types and interfaces
export type { RateLimiterConfig } from './config'

// Core functionality
export { createRateLimiter } from './core'

// Default export for backward compatibility
export { createRateLimiter as default } from './core'

// Predefined rate limiters
export { authRateLimiter, generalRateLimiter, strictRateLimiter } from './presets'

// Utilities (for advanced use cases)
export { getClientIp } from './utils'
