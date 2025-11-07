import { afterEach, beforeEach, describe, expect, mock, spyOn, test } from 'bun:test'

import { validateEnvVars } from '../env'

describe('Environment Configuration', () => {
  // eslint-disable-next-line ts/unbound-method
  const originalExit = process.exit
  let consoleErrorSpy: ReturnType<typeof spyOn>
  let processExitMock: ReturnType<typeof mock>

  const createBaseEnv = (nodeEnv: string = 'development'): typeof Bun.env => ({
    NODE_ENV: nodeEnv,
    POSTGRES_USER: 'testuser',
    POSTGRES_PASSWORD: 'TestPass123!',
    POSTGRES_HOST: 'localhost',
    POSTGRES_PORT: '5432',
    POSTGRES_DB: 'test_db',
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

  test('should validate with default values across all environments', () => {
    const devEnv = validateEnvVars(createBaseEnv('development'))
    const testEnv = validateEnvVars(createBaseEnv('test'))

    // Core defaults
    expect(devEnv.NODE_ENV).toBe('development')
    expect(testEnv.NODE_ENV).toBe('test')
    expect(devEnv.LOG_LEVEL).toBe('info')
    expect(testEnv.LOG_LEVEL).toBe('info')

    // Database defaults
    expect(devEnv.POSTGRES_MAX_CONNECTIONS).toBe(2)
    expect(testEnv.POSTGRES_MAX_CONNECTIONS).toBe(2)

    // Network defaults
    expect(devEnv.JWT_ACCESS_EXPIRATION).toBe(3600)
    expect(devEnv.COOKIE_REFRESH_TOKEN_NAME).toBe('refresh-token')
    expect(devEnv.COOKIE_REFRESH_TOKEN_EXPIRATION).toBe(86400)
    expect(devEnv.BE_BASE_URL).toBe('http://localhost:3000')
    expect(devEnv.FE_BASE_URL).toBe('http://localhost:5173')

    // Company defaults
    expect(devEnv.COMPANY_NAME).toBe('SMELA')
    expect(devEnv.COMPANY_SOCIAL_LINKS).toEqual({})

    // POSTGRES_URL construction
    expect(devEnv.POSTGRES_URL).toBe('postgresql://testuser:TestPass123!@localhost:5432/test_db')
  })

  test('should override defaults with custom values', () => {
    const customEnv = {
      ...createBaseEnv('development'),
      LOG_LEVEL: 'debug',
      POSTGRES_MAX_CONNECTIONS: '5',
      JWT_ACCESS_EXPIRATION: '7200',
      COOKIE_REFRESH_TOKEN_NAME: 'custom-token',
      BE_BASE_URL: 'http://localhost:8000',
      COMPANY_NAME: 'CustomCompany',
    }

    const env = validateEnvVars(customEnv)

    expect(env.LOG_LEVEL).toBe('debug')
    expect(env.POSTGRES_MAX_CONNECTIONS).toBe(5)
    expect(env.JWT_ACCESS_EXPIRATION).toBe(7200)
    expect(env.COOKIE_REFRESH_TOKEN_NAME).toBe('custom-token')
    expect(env.BE_BASE_URL).toBe('http://localhost:8000')
    expect(env.COMPANY_NAME).toBe('CustomCompany')
  })

  test('should handle ALLOWED_ORIGINS for optional environments (dev/test)', () => {
    const devEnv = validateEnvVars(createBaseEnv('development'))
    const testEnv = validateEnvVars(createBaseEnv('test'))

    expect(devEnv.ALLOWED_ORIGINS).toBeUndefined()
    expect(testEnv.ALLOWED_ORIGINS).toBeUndefined()
    expect(processExitMock).not.toHaveBeenCalled()

    // Should also work with NODE_ENV undefined (defaults to development)
    const envWithoutNodeEnv = createBaseEnv()
    delete envWithoutNodeEnv.NODE_ENV
    const defaultEnv = validateEnvVars(envWithoutNodeEnv)

    expect(defaultEnv.NODE_ENV).toBe('development')
    expect(defaultEnv.ALLOWED_ORIGINS).toBeUndefined()
  })

  test('should handle ALLOWED_ORIGINS for required environments (staging/production)', () => {
    // Valid cases
    const stagingEnv = {
      ...createBaseEnv('staging'),
      ALLOWED_ORIGINS: 'https://staging.example.com',
    }
    const prodEnv = {
      ...createBaseEnv('production'),
      ALLOWED_ORIGINS: 'https://example.com,https://www.example.com',
    }

    const validStaging = validateEnvVars(stagingEnv)
    const validProduction = validateEnvVars(prodEnv)

    expect(validStaging.ALLOWED_ORIGINS).toBe('https://staging.example.com')
    expect(validProduction.ALLOWED_ORIGINS).toBe('https://example.com,https://www.example.com')

    // Invalid cases - missing ALLOWED_ORIGINS
    validateEnvVars(createBaseEnv('staging'))
    expect(processExitMock).toHaveBeenCalledWith(1)

    processExitMock.mockClear()
    validateEnvVars(createBaseEnv('production'))
    expect(processExitMock).toHaveBeenCalledWith(1)

    // Invalid cases - empty ALLOWED_ORIGINS
    processExitMock.mockClear()
    validateEnvVars({ ...createBaseEnv('staging'), ALLOWED_ORIGINS: '   ' })
    expect(processExitMock).toHaveBeenCalledWith(1)
  })

  test('should validate database field requirements', () => {
    const testCases = [
      { field: 'POSTGRES_USER', value: undefined, desc: 'missing user' },
      { field: 'POSTGRES_USER', value: 'usr', desc: 'user too short' },
      { field: 'POSTGRES_PASSWORD', value: undefined, desc: 'missing password' },
      { field: 'POSTGRES_DB', value: undefined, desc: 'missing database' },
      { field: 'POSTGRES_HOST', value: 'host', desc: 'host too short' },
      { field: 'POSTGRES_MAX_CONNECTIONS', value: '15', desc: 'max connections exceeded' },
    ]

    testCases.forEach(({ field, value }) => {
      const invalidEnv = { ...createBaseEnv() }
      if (value === undefined) {
        delete invalidEnv[field as keyof typeof invalidEnv]
      } else {
        invalidEnv[field as keyof typeof invalidEnv] = value
      }

      validateEnvVars(invalidEnv)
      expect(processExitMock).toHaveBeenCalledWith(1)
      processExitMock.mockClear()
    })
  })

  test('should validate password complexity requirements', () => {
    const invalidPasswords = [
      { value: 'Short1!', desc: 'too short' },
      { value: 'UPPERCASE123!', desc: 'no lowercase' },
      { value: 'lowercase123!', desc: 'no uppercase' },
      { value: 'NoNumbers!', desc: 'no numbers' },
      { value: 'NoSymbols123', desc: 'no symbols' },
    ]

    invalidPasswords.forEach(({ value }) => {
      const invalidEnv = { ...createBaseEnv(), POSTGRES_PASSWORD: value }
      validateEnvVars(invalidEnv)
      expect(processExitMock).toHaveBeenCalledWith(1)
      processExitMock.mockClear()
    })
  })

  test('should validate other required fields', () => {
    const testCases = [
      { field: 'JWT_ACCESS_SECRET', value: undefined, desc: 'missing JWT secret' },
      { field: 'JWT_ACCESS_SECRET', value: 'short', desc: 'JWT secret too short' },
      { field: 'NODE_ENV', value: 'invalid-env', desc: 'invalid NODE_ENV' },
      { field: 'LOG_LEVEL', value: 'invalid-level', desc: 'invalid LOG_LEVEL' },
      { field: 'EMAIL_SENDER_PROFILES', value: 'invalid-json', desc: 'invalid EMAIL_SENDER_PROFILES JSON' },
      { field: 'EMAIL_SENDER_PROFILES', value: '{"system":{"email":"not-an-email","name":"Test"}}', desc: 'invalid email in profiles' },
      { field: 'CAPTCHA_SECRET_KEY', value: 'invalid-format', desc: 'invalid CAPTCHA format' },
    ]

    testCases.forEach(({ field, value }) => {
      const invalidEnv = { ...createBaseEnv() }
      if (value === undefined) {
        delete invalidEnv[field as keyof typeof invalidEnv]
      } else {
        invalidEnv[field as keyof typeof invalidEnv] = value
      }

      validateEnvVars(invalidEnv)
      expect(processExitMock).toHaveBeenCalledWith(1)
      processExitMock.mockClear()
    })
  })

  test('should parse valid JSON configurations', () => {
    const customEnv = {
      ...createBaseEnv('development'),
      COMPANY_SOCIAL_LINKS: JSON.stringify({
        twitter: 'https://twitter.com/company',
        github: 'https://github.com/company',
      }),
      EMAIL_SENDER_PROFILES: JSON.stringify({
        system: { email: 'noreply@example.com', name: 'Company' },
        marketing: { email: 'marketing@example.com', name: 'Marketing Team' },
      }),
    }

    const env = validateEnvVars(customEnv)

    expect(env.COMPANY_SOCIAL_LINKS).toEqual({
      twitter: 'https://twitter.com/company',
      github: 'https://github.com/company',
    })

    expect(env.EMAIL_SENDER_PROFILES).toEqual({
      system: { email: 'noreply@example.com', name: 'Company' },
      marketing: { email: 'marketing@example.com', name: 'Marketing Team' },
    })
  })

  test('should handle invalid JSON gracefully', () => {
    const customEnv = {
      ...createBaseEnv('development'),
      COMPANY_SOCIAL_LINKS: 'invalid-json',
    }

    const env = validateEnvVars(customEnv)
    expect(env.COMPANY_SOCIAL_LINKS).toEqual({})
  })
})
