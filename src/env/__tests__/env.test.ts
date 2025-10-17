import { afterEach, beforeEach, describe, expect, mock, spyOn, test } from 'bun:test'

import { validateEnvVars } from '../env'

describe('Environment Configuration', () => {
  // eslint-disable-next-line ts/unbound-method
  const originalExit = process.exit
  let consoleErrorSpy: ReturnType<typeof spyOn>
  let processExitMock: ReturnType<typeof mock>

  const createBaseEnv = (nodeEnv: string = 'development'): typeof Bun.env => ({
    NODE_ENV: nodeEnv,
    DB_URL: 'postgresql://user:pass@localhost:5432/test_db',
    JWT_ACCESS_SECRET: 'test-jwt-secret-key-min-10-chars',
    EMAIL_SENDER_PROFILES: '{"system":{"email":"test@example.com","name":"Test System"}}',
    CAPTCHA_SECRET_KEY: '1234567890123456789012345678901234567890',
  })

  beforeEach(() => {
    consoleErrorSpy = spyOn(console, 'error').mockImplementation((...args) => {
      // eslint-disable-next-line no-console
      console.log(...args)
    })
    processExitMock = mock(() => {})
    process.exit = processExitMock as never
  })

  afterEach(() => {
    process.exit = originalExit
    consoleErrorSpy.mockRestore()
  })

  describe('Development Environment', () => {
    test('should validate with all defaults', () => {
      const env = validateEnvVars(createBaseEnv('development'))

      expect(env.NODE_ENV).toBe('development')
      expect(env.LOG_LEVEL).toBe('info')
      expect(env.DB_MAX_CONNECTIONS).toBe(2)
      expect(env.JWT_ACCESS_EXPIRATION).toBe(3600)
      expect(env.COOKIE_NAME).toBe('access-token')
      expect(env.COOKIE_EXPIRATION).toBe(3600)
      expect(env.BE_BASE_URL).toBe('http://localhost:3000')
      expect(env.FE_BASE_URL).toBe('http://localhost:5173')
      expect(env.COMPANY_NAME).toBe('SMELA')
      expect(env.COMPANY_SOCIAL_LINKS).toEqual({})
    })

    test('should allow missing ALLOWED_ORIGINS', () => {
      const env = validateEnvVars(createBaseEnv('development'))

      expect(env.ALLOWED_ORIGINS).toBeUndefined()
      expect(processExitMock).not.toHaveBeenCalled()
    })

    test('should use custom values when provided', () => {
      const customEnv = {
        ...createBaseEnv('development'),
        LOG_LEVEL: 'debug',
        DB_MAX_CONNECTIONS: '5',
        JWT_ACCESS_EXPIRATION: '7200',
        COOKIE_NAME: 'custom-token',
        BE_BASE_URL: 'http://localhost:8000',
        COMPANY_NAME: 'CustomCompany',
      }

      const env = validateEnvVars(customEnv)

      expect(env.LOG_LEVEL).toBe('debug')
      expect(env.DB_MAX_CONNECTIONS).toBe(5)
      expect(env.JWT_ACCESS_EXPIRATION).toBe(7200)
      expect(env.COOKIE_NAME).toBe('custom-token')
      expect(env.BE_BASE_URL).toBe('http://localhost:8000')
      expect(env.COMPANY_NAME).toBe('CustomCompany')
    })

    test('should parse COMPANY_SOCIAL_LINKS when valid JSON', () => {
      const customEnv = {
        ...createBaseEnv('development'),
        COMPANY_SOCIAL_LINKS: JSON.stringify({
          twitter: 'https://twitter.com/company',
          github: 'https://github.com/company',
        }),
      }

      const env = validateEnvVars(customEnv)

      expect(env.COMPANY_SOCIAL_LINKS).toEqual({
        twitter: 'https://twitter.com/company',
        github: 'https://github.com/company',
      })
    })

    test('should return empty object for invalid COMPANY_SOCIAL_LINKS', () => {
      const customEnv = {
        ...createBaseEnv('development'),
        COMPANY_SOCIAL_LINKS: 'invalid-json',
      }

      const env = validateEnvVars(customEnv)

      expect(env.COMPANY_SOCIAL_LINKS).toEqual({})
    })
  })

  describe('Test Environment', () => {
    test('should validate with test defaults', () => {
      const env = validateEnvVars(createBaseEnv('test'))

      expect(env.NODE_ENV).toBe('test')
      expect(env.LOG_LEVEL).toBe('info')
      expect(env.DB_MAX_CONNECTIONS).toBe(2)
    })

    test('should allow missing ALLOWED_ORIGINS', () => {
      const env = validateEnvVars(createBaseEnv('test'))

      expect(env.ALLOWED_ORIGINS).toBeUndefined()
      expect(processExitMock).not.toHaveBeenCalled()
    })
  })

  describe('Staging Environment', () => {
    test('should validate with ALLOWED_ORIGINS provided', () => {
      const customEnv = {
        ...createBaseEnv('staging'),
        DB_MAX_CONNECTIONS: '10',
        ALLOWED_ORIGINS: 'https://staging.example.com',
        EMAIL_RESEND_API_KEY: 'staging-resend-key',
      }

      const env = validateEnvVars(customEnv)

      expect(env.NODE_ENV).toBe('staging')
      expect(env.DB_MAX_CONNECTIONS).toBe(10)
      expect(env.ALLOWED_ORIGINS).toBe('https://staging.example.com')
      expect(env.EMAIL_RESEND_API_KEY).toBe('staging-resend-key')
    })

    test('should require ALLOWED_ORIGINS', () => {
      validateEnvVars(createBaseEnv('staging'))

      expect(processExitMock).toHaveBeenCalledWith(1)
      expect(consoleErrorSpy).toHaveBeenCalled()
      const errorCall = consoleErrorSpy.mock.calls[0]
      expect(errorCall[0]).toBe('❌ Failed to parse environment variables:')
    })

    test('should reject empty ALLOWED_ORIGINS', () => {
      const customEnv = {
        ...createBaseEnv('staging'),
        ALLOWED_ORIGINS: '   ',
      }

      validateEnvVars(customEnv)

      expect(processExitMock).toHaveBeenCalledWith(1)
      expect(consoleErrorSpy).toHaveBeenCalled()
    })
  })

  describe('Production Environment', () => {
    test('should validate with all production values', () => {
      const customEnv = {
        ...createBaseEnv('production'),
        LOG_LEVEL: 'warn',
        DB_URL: 'postgresql://prod:secure@prod-db:5432/prod_db',
        DB_MAX_CONNECTIONS: '10',
        JWT_ACCESS_EXPIRATION: '3600',
        COOKIE_NAME: 'prod-token',
        COOKIE_DOMAIN: '.example.com',
        ALLOWED_ORIGINS: 'https://example.com,https://www.example.com',
        BE_BASE_URL: 'https://api.example.com',
        FE_BASE_URL: 'https://example.com',
        EMAIL_RESEND_API_KEY: 'production-resend-key',
        COMPANY_NAME: 'Example Inc',
        COMPANY_SOCIAL_LINKS: JSON.stringify({
          twitter: 'https://twitter.com/example',
          linkedin: 'https://linkedin.com/company/example',
        }),
      }

      const env = validateEnvVars(customEnv)

      expect(env.NODE_ENV).toBe('production')
      expect(env.LOG_LEVEL).toBe('warn')
      expect(env.DB_MAX_CONNECTIONS).toBe(10)
      expect(env.COOKIE_DOMAIN).toBe('.example.com')
      expect(env.ALLOWED_ORIGINS).toBe('https://example.com,https://www.example.com')
      expect(env.BE_BASE_URL).toBe('https://api.example.com')
      expect(env.EMAIL_RESEND_API_KEY).toBe('production-resend-key')
      expect(env.COMPANY_NAME).toBe('Example Inc')
      expect(env.COMPANY_SOCIAL_LINKS).toEqual({
        twitter: 'https://twitter.com/example',
        linkedin: 'https://linkedin.com/company/example',
      })
    })

    test('should require ALLOWED_ORIGINS', () => {
      validateEnvVars(createBaseEnv('production'))

      expect(processExitMock).toHaveBeenCalledWith(1)
      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    test('should reject empty ALLOWED_ORIGINS', () => {
      const customEnv = {
        ...createBaseEnv('production'),
        ALLOWED_ORIGINS: '   ',
      }

      validateEnvVars(customEnv)

      expect(processExitMock).toHaveBeenCalledWith(1)
      expect(consoleErrorSpy).toHaveBeenCalled()
    })
  })

  describe('Default NODE_ENV Fallback', () => {
    test('should default to development when NODE_ENV is undefined', () => {
      const envWithoutNodeEnv = createBaseEnv()
      delete envWithoutNodeEnv.NODE_ENV

      const env = validateEnvVars(envWithoutNodeEnv)

      expect(env.NODE_ENV).toBe('development')
      expect(env.ALLOWED_ORIGINS).toBeUndefined()
      expect(processExitMock).not.toHaveBeenCalled()
    })
  })

  describe('Validation Errors', () => {
    test('should exit when DB_URL is missing', () => {
      const invalidEnv = createBaseEnv()
      delete invalidEnv.DB_URL

      validateEnvVars(invalidEnv)

      expect(processExitMock).toHaveBeenCalledWith(1)
      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    test('should exit when DB_URL is invalid', () => {
      const invalidEnv = {
        ...createBaseEnv(),
        DB_URL: 'not-a-valid-url',
      }

      validateEnvVars(invalidEnv)

      expect(processExitMock).toHaveBeenCalledWith(1)
      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    test('should exit when JWT_ACCESS_SECRET is missing', () => {
      const invalidEnv = createBaseEnv()
      delete invalidEnv.JWT_ACCESS_SECRET

      validateEnvVars(invalidEnv)

      expect(processExitMock).toHaveBeenCalledWith(1)
      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    test('should exit when JWT_ACCESS_SECRET is too short', () => {
      const invalidEnv = {
        ...createBaseEnv(),
        JWT_ACCESS_SECRET: 'short',
      }

      validateEnvVars(invalidEnv)

      expect(processExitMock).toHaveBeenCalledWith(1)
      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    test('should exit when EMAIL_SENDER_PROFILES is invalid JSON', () => {
      const invalidEnv = {
        ...createBaseEnv(),
        EMAIL_SENDER_PROFILES: 'invalid-json',
      }

      validateEnvVars(invalidEnv)

      expect(processExitMock).toHaveBeenCalledWith(1)
      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    test('should exit when EMAIL_SENDER_PROFILES has invalid email', () => {
      const invalidEnv = {
        ...createBaseEnv(),
        EMAIL_SENDER_PROFILES: '{"system":{"email":"not-an-email","name":"Test"}}',
      }

      validateEnvVars(invalidEnv)

      expect(processExitMock).toHaveBeenCalledWith(1)
      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    test('should exit when CAPTCHA_SECRET_KEY has invalid format', () => {
      const invalidEnv = {
        ...createBaseEnv(),
        CAPTCHA_SECRET_KEY: 'invalid-format',
      }

      validateEnvVars(invalidEnv)

      expect(processExitMock).toHaveBeenCalledWith(1)
      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    test('should exit when NODE_ENV is invalid', () => {
      const invalidEnv = {
        ...createBaseEnv(),
        NODE_ENV: 'invalid-env',
      }

      validateEnvVars(invalidEnv)

      expect(processExitMock).toHaveBeenCalledWith(1)
      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    test('should exit when LOG_LEVEL is invalid', () => {
      const invalidEnv = {
        ...createBaseEnv(),
        LOG_LEVEL: 'invalid-level',
      }

      validateEnvVars(invalidEnv)

      expect(processExitMock).toHaveBeenCalledWith(1)
      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    test('should exit when DB_MAX_CONNECTIONS exceeds maximum', () => {
      const invalidEnv = {
        ...createBaseEnv(),
        DB_MAX_CONNECTIONS: '15',
      }

      validateEnvVars(invalidEnv)

      expect(processExitMock).toHaveBeenCalledWith(1)
      expect(consoleErrorSpy).toHaveBeenCalled()
    })
  })
})
