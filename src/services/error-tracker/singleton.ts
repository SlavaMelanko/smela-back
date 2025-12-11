import type { ErrorTracker } from './error-tracker'

import { createErrorTracker } from './factory'

let errorTrackerInstance: ErrorTracker | null = null

/**
 * Gets the singleton error tracker instance.
 *
 * Creates the instance on first call and returns the same instance
 * on subsequent calls.
 *
 * @returns Error tracker instance.
 */
export const getErrorTracker = (): ErrorTracker => {
  if (!errorTrackerInstance) {
    errorTrackerInstance = createErrorTracker()
  }

  return errorTrackerInstance
}

/**
 * Initializes the error tracker service.
 *
 * Should be called once at application startup.
 */
export const initErrorTracker = (): void => {
  getErrorTracker().init()
}
