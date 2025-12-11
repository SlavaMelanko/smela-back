import type { ErrorTracker } from './error-tracker'

import { sentryConfig, SentryErrorTracker } from './sentry'

/**
 * Factory function to create an error tracker service instance.
 *
 * Currently returns a Sentry error tracker, but can be extended
 * to support different providers based on configuration.
 *
 * @returns Error tracker service instance.
 */
export const createErrorTracker = (): ErrorTracker => {
  return new SentryErrorTracker(sentryConfig)
}
