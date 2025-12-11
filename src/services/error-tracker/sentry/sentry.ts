import * as Sentry from '@sentry/bun'

import { logger } from '@/logging'

import type { Config } from '../config'
import type { ErrorTracker, SeverityLevel } from '../error-tracker'

/**
 * Sentry error tracking service implementation.
 *
 * Implements the ErrorTracker interface for Sentry's error tracking service.
 */
export class SentryErrorTracker implements ErrorTracker {
  private config: Config
  private initialized = false

  constructor(config: Config) {
    this.config = config
  }

  init(): void {
    if (!this.config.dsn) {
      logger.info('🚫 Error tracker: disabled (no SENTRY_DSN)')

      return
    }

    Sentry.init({
      dsn: this.config.dsn,
      environment: this.config.environment,
      release: this.config.release,
    })

    this.initialized = true

    logger.info({ release: this.config.release }, '🐛 Error tracker: Sentry')
  }

  captureError(error: Error): void {
    if (!this.initialized) {
      return
    }

    Sentry.captureException(error)
  }

  captureMessage(message: string, level: SeverityLevel = 'warning'): void {
    if (!this.initialized) {
      return
    }

    Sentry.captureMessage(message, level)
  }

  setUser(user: { id: string }): void {
    if (!this.initialized) {
      return
    }

    Sentry.setUser({ id: user.id })
  }

  clearUser(): void {
    if (!this.initialized) {
      return
    }

    Sentry.setUser(null)
  }
}
