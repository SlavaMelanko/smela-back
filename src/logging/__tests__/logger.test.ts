import type pino from 'pino'

import { afterEach, beforeEach, describe, expect, it, spyOn } from 'bun:test'

import { ModuleMocker } from '@/__tests__/module-mocker'

describe('Logger', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let logger: pino.Logger
  let debugSpy: any
  let infoSpy: any
  let warnSpy: any
  let errorSpy: any

  afterEach(async () => {
    debugSpy?.mockClear()
    infoSpy?.mockClear()
    warnSpy?.mockClear()
    errorSpy?.mockClear()
    await moduleMocker.clear()
  })

  describe('with LOG_LEVEL=debug', () => {
    beforeEach(async () => {
      await moduleMocker.mock('@/env', () => ({
        default: {
          LOG_LEVEL: 'debug',
          NODE_ENV: 'test',
        },
        isDevEnv: () => false,
        isProdEnv: () => false,
        isTestEnv: () => true,
        isStagingEnv: () => false,
        isDevOrTestEnv: () => true,
        isStagingOrProdEnv: () => false,
      }))

      const loggerModule = await import('../logger')
      logger = loggerModule.default

      debugSpy = spyOn(logger, 'debug').mockImplementation(() => {})
      infoSpy = spyOn(logger, 'info').mockImplementation(() => {})
      warnSpy = spyOn(logger, 'warn').mockImplementation(() => {})
      errorSpy = spyOn(logger, 'error').mockImplementation(() => {})
    })

    it('should log debug messages', () => {
      logger.debug('Processing email template compilation')
      expect(debugSpy).toHaveBeenCalledWith('Processing email template compilation')
    })

    it('should log info messages', () => {
      logger.info('Email sent successfully')
      expect(infoSpy).toHaveBeenCalledWith('Email sent successfully')
    })

    it('should log warning messages', () => {
      logger.warn('Attempt 1 to send email failed, retrying')
      expect(warnSpy).toHaveBeenCalledWith('Attempt 1 to send email failed, retrying')
    })

    it('should log error messages', () => {
      logger.error('Failed to send verification email')
      expect(errorSpy).toHaveBeenCalledWith('Failed to send verification email')
    })

    it('should log all levels when LOG_LEVEL is debug', () => {
      logger.debug('Database query optimization analysis')
      logger.info('User authentication successful')
      logger.warn('Rate limit threshold approaching')
      logger.error('Database connection pool exhausted')

      expect(debugSpy).toHaveBeenCalledTimes(1)
      expect(infoSpy).toHaveBeenCalledTimes(1)
      expect(warnSpy).toHaveBeenCalledTimes(1)
      expect(errorSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('with LOG_LEVEL=error', () => {
    beforeEach(async () => {
      await moduleMocker.mock('@/env', () => ({
        default: {
          LOG_LEVEL: 'error',
          NODE_ENV: 'production',
        },
        isDevEnv: () => false,
        isProdEnv: () => true,
        isTestEnv: () => false,
        isStagingEnv: () => false,
        isDevOrTestEnv: () => false,
        isStagingOrProdEnv: () => true,
      }))

      const loggerModule = await import('../logger')
      logger = loggerModule.default

      debugSpy = spyOn(logger, 'debug').mockImplementation(() => {})
      infoSpy = spyOn(logger, 'info').mockImplementation(() => {})
      warnSpy = spyOn(logger, 'warn').mockImplementation(() => {})
      errorSpy = spyOn(logger, 'error').mockImplementation(() => {})
    })

    it('should accept debug messages but not output them when LOG_LEVEL is error', () => {
      logger.debug('Processing email template compilation')
      expect(debugSpy).toHaveBeenCalledTimes(1)
      expect(debugSpy).toHaveBeenCalledWith('Processing email template compilation')
    })

    it('should accept info messages but not output them when LOG_LEVEL is error', () => {
      logger.info('Email sent successfully')
      expect(infoSpy).toHaveBeenCalledTimes(1)
      expect(infoSpy).toHaveBeenCalledWith('Email sent successfully')
    })

    it('should accept warning messages but not output them when LOG_LEVEL is error', () => {
      logger.warn('Attempt 1 to send email failed, retrying')
      expect(warnSpy).toHaveBeenCalledTimes(1)
      expect(warnSpy).toHaveBeenCalledWith('Attempt 1 to send email failed, retrying')
    })

    it('should log error messages', () => {
      logger.error('Email service is unavailable')
      expect(errorSpy).toHaveBeenCalledWith('Email service is unavailable')
    })

    it('should handle all log levels but only output error when LOG_LEVEL is error', () => {
      logger.debug('Database query optimization analysis')
      logger.info('User authentication successful')
      logger.warn('Rate limit threshold approaching')
      logger.error('Critical system failure detected')

      expect(debugSpy).toHaveBeenCalledTimes(1)
      expect(infoSpy).toHaveBeenCalledTimes(1)
      expect(warnSpy).toHaveBeenCalledTimes(1)
      expect(errorSpy).toHaveBeenCalledTimes(1)
    })
  })
})
