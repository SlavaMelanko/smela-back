/* eslint-disable node/no-process-env */
/* eslint-disable ts/no-require-imports */
import { afterEach, beforeEach, describe, expect, it, spyOn } from 'bun:test'
import { Hono } from 'hono'

// Store original environment
const originalEnv = { ...process.env }

// Helper function to clear environment-dependent modules
const clearEnvironmentModules = () => {
  delete require.cache[require.resolve('../index')]
  delete require.cache[require.resolve('../env/index')]
  delete require.cache[require.resolve('../env/dev')]
  delete require.cache[require.resolve('../env/test')]
  delete require.cache[require.resolve('../env/staging-and-prod')]
  delete require.cache[require.resolve('../env/fallback')]

  // Clear all @/lib/env modules and validation
  Object.keys(require.cache).forEach((key) => {
    if (key.includes('@/lib/env') || key.includes('/lib/env') || key.includes('/lib/validation')) {
      delete require.cache[key]
    }
  })
}

describe('CORS Middleware', () => {
  let app: Hono

  beforeEach(() => {
    clearEnvironmentModules()
  })

  afterEach(() => {
    // Properly restore original environment
    Object.keys(process.env).forEach((key) => {
      if (!(key in originalEnv)) {
        delete process.env[key]
      }
    })
    Object.assign(process.env, originalEnv)

    clearEnvironmentModules()
  })

  describe('Development Environment', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development'
      process.env.JWT_SECRET = 'test-secret-key'
      process.env.DB_URL = 'postgresql://test'
      process.env.EMAIL_SENDER_PROFILES = JSON.stringify({
        system: { email: 'test@test.com', name: 'Test' },
      })

      // Import after setting env
      const corsMiddleware = require('../index').default
      app = new Hono()
      app.use('*', corsMiddleware)
      app.get('/test', c => c.json({ success: true }))
    })

    it('should allow localhost origins', async () => {
      const response = await app.request('/test', {
        headers: {
          Origin: 'http://localhost:3000',
        },
      })

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000')
      expect(response.headers.get('Access-Control-Allow-Credentials')).toBe('true')
    })

    it('should allow 127.0.0.1 origins', async () => {
      const response = await app.request('/test', {
        headers: {
          Origin: 'http://127.0.0.1:5173',
        },
      })

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://127.0.0.1:5173')
    })

    it('should allow https localhost', async () => {
      const response = await app.request('/test', {
        headers: {
          Origin: 'https://localhost:8080',
        },
      })

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://localhost:8080')
    })

    it('should reject non-localhost origins', async () => {
      const response = await app.request('/test', {
        headers: {
          Origin: 'https://example.com',
        },
      })

      expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull()
    })

    it('should handle requests without origin header', async () => {
      const response = await app.request('/test')

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
    })

    it('should handle preflight requests', async () => {
      const response = await app.request('/test', {
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://localhost:3000',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type',
        },
      })

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000')
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST')
      expect(response.headers.get('Access-Control-Max-Age')).toBe('600')
    })
  })

  describe('Test Environment', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'test'
      process.env.JWT_SECRET = 'test-secret-key'
      process.env.DB_URL = 'postgresql://test'
      process.env.EMAIL_SENDER_PROFILES = JSON.stringify({
        system: { email: 'test@test.com', name: 'Test' },
      })

      const corsMiddleware = require('../index').default
      app = new Hono()
      app.use('*', corsMiddleware)
      app.get('/test', c => c.json({ success: true }))
    })

    it('should allow all origins', async () => {
      const response = await app.request('/test', {
        headers: {
          Origin: 'https://any-domain.com',
        },
      })

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
    })

    it('should not send credentials', async () => {
      const response = await app.request('/test', {
        headers: {
          Origin: 'https://any-domain.com',
        },
      })

      expect(response.headers.get('Access-Control-Allow-Credentials')).toBeNull()
    })
  })

  describe('Staging Environment', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'staging'
      process.env.JWT_SECRET = 'test-secret-key'
      process.env.DB_URL = 'postgresql://test'
      process.env.ALLOWED_ORIGINS = 'https://app-staging.example.com,https://staging.example.com'
      process.env.EMAIL_SENDER_PROFILES = JSON.stringify({
        system: { email: 'test@test.com', name: 'Test' },
      })

      const corsMiddleware = require('../index').default
      app = new Hono()
      app.use('*', corsMiddleware)
      app.get('/test', c => c.json({ success: true }))
    })

    it('should allow configured origins', async () => {
      const response = await app.request('/test', {
        headers: {
          Origin: 'https://app-staging.example.com',
        },
      })

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://app-staging.example.com')
      expect(response.headers.get('Access-Control-Allow-Credentials')).toBe('true')
    })

    it('should reject non-configured origins', async () => {
      const response = await app.request('/test', {
        headers: {
          Origin: 'https://unauthorized.com',
        },
      })

      expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull()
    })

    it('should reject requests without origin', async () => {
      const response = await app.request('/test')

      expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull()
    })

    it('should handle preflight with longer cache', async () => {
      const response = await app.request('/test', {
        method: 'OPTIONS',
        headers: {
          'Origin': 'https://app-staging.example.com',
          'Access-Control-Request-Method': 'DELETE',
        },
      })

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://app-staging.example.com')
      expect(response.headers.get('Access-Control-Max-Age')).toBe('3600')
    })
  })

  describe('Production Environment', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production'
      process.env.JWT_SECRET = 'test-secret-key'
      process.env.DB_URL = 'postgresql://test'
      process.env.ALLOWED_ORIGINS = 'https://app.example.com,https://www.example.com'
      process.env.EMAIL_SENDER_PROFILES = JSON.stringify({
        system: { email: 'test@test.com', name: 'Test' },
      })

      const corsMiddleware = require('../index').default
      app = new Hono()
      app.use('*', corsMiddleware)
      app.get('/test', c => c.json({ success: true }))
    })

    it('should only allow explicitly configured origins', async () => {
      const response1 = await app.request('/test', {
        headers: {
          Origin: 'https://app.example.com',
        },
      })

      expect(response1.headers.get('Access-Control-Allow-Origin')).toBe('https://app.example.com')

      const response2 = await app.request('/test', {
        headers: {
          Origin: 'https://www.example.com',
        },
      })

      expect(response2.headers.get('Access-Control-Allow-Origin')).toBe('https://www.example.com')
    })

    it('should reject all non-configured origins', async () => {
      const response = await app.request('/test', {
        headers: {
          Origin: 'https://malicious.com',
        },
      })

      expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull()
    })

    it('should reject localhost in production', async () => {
      const response = await app.request('/test', {
        headers: {
          Origin: 'http://localhost:3000',
        },
      })

      expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull()
    })

    it('should use proper security headers', async () => {
      const response = await app.request('/test', {
        method: 'OPTIONS',
        headers: {
          'Origin': 'https://app.example.com',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type,Authorization',
        },
      })

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://app.example.com')
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST')
      expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Content-Type')
      expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Authorization')
      expect(response.headers.get('Access-Control-Max-Age')).toBe('3600')
    })
  })

  describe('Production Environment without ALLOWED_ORIGINS', () => {
    it('should fail validation when ALLOWED_ORIGINS is not set', () => {
      // Spy on console.error and process.exit to prevent actual exit
      const consoleErrorSpy = spyOn(console, 'error').mockImplementation(() => {})
      const processExitSpy = spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('Process exit called')
      })

      process.env.NODE_ENV = 'production'
      process.env.JWT_SECRET = 'test-secret-key'
      process.env.DB_URL = 'postgresql://test'
      process.env.EMAIL_SENDER_PROFILES = JSON.stringify({
        system: { email: 'test@test.com', name: 'Test' },
      })
      // No ALLOWED_ORIGINS set

      // Validation should fail when trying to load the env module
      expect(() => {
        delete require.cache[require.resolve('@/lib/env')]
        require('@/lib/env')
      }).toThrow('Process exit called')

      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid env:'),
        expect.objectContaining({
          ALLOWED_ORIGINS: expect.arrayContaining([
            expect.stringContaining('ALLOWED_ORIGINS is required'),
          ]),
        }),
      )

      // Restore spies
      consoleErrorSpy.mockRestore()
      processExitSpy.mockRestore()
    })
  })

  describe('Production Environment with empty ALLOWED_ORIGINS', () => {
    it('should fail validation when ALLOWED_ORIGINS is empty', () => {
      // Spy on console.error and process.exit to prevent actual exit
      const consoleErrorSpy = spyOn(console, 'error').mockImplementation(() => {})
      const processExitSpy = spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('Process exit called')
      })

      process.env.NODE_ENV = 'production'
      process.env.JWT_SECRET = 'test-secret-key'
      process.env.DB_URL = 'postgresql://test'
      process.env.ALLOWED_ORIGINS = '' // Empty string
      process.env.EMAIL_SENDER_PROFILES = JSON.stringify({
        system: { email: 'test@test.com', name: 'Test' },
      })

      // Validation should fail when trying to load the env module
      expect(() => {
        delete require.cache[require.resolve('@/lib/env')]
        require('@/lib/env')
      }).toThrow('Process exit called')

      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid env:'),
        expect.objectContaining({
          ALLOWED_ORIGINS: expect.arrayContaining([
            expect.stringContaining('ALLOWED_ORIGINS is required'),
          ]),
        }),
      )

      // Restore spies
      consoleErrorSpy.mockRestore()
      processExitSpy.mockRestore()
    })
  })
})
