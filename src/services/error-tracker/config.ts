/**
 * Generic error tracker configuration interface.
 *
 * This can be extended by specific error tracking providers
 * (Sentry, Bugsnag, Rollbar, etc.).
 */
export interface Config {
  dsn?: string
  environment: string
  release: string
}
