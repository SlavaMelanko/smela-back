export type SeverityLevel = 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug'

/**
 * Interface for error tracking services.
 *
 * Provides a contract for different error tracking implementations
 * (Sentry, Bugsnag, Rollbar, etc.).
 */
export interface ErrorTracker {
  /**
   * Initializes the error tracking service.
   *
   * Should be called once at application startup.
   * Implementations should handle missing configuration gracefully.
   */
  init: () => void

  /**
   * Captures an error and sends it to the tracking service.
   *
   * @param error - The error to capture.
   */
  captureError: (error: Error) => void

  /**
   * Captures a message with a severity level.
   *
   * @param message - The message to capture.
   * @param level - The severity level (default: 'warning').
   */
  captureMessage: (message: string, level?: SeverityLevel) => void

  /**
   * Sets the user context for error tracking.
   *
   * @param user - User information to associate with errors.
   */
  setUser: (user: { id: string }) => void

  /**
   * Clears the user context.
   */
  clearUser: () => void
}
