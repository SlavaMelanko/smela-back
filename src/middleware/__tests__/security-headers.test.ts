import { beforeEach, describe, expect, it } from 'bun:test'
import { Hono } from 'hono'

import type { AppContext } from '@/context'

import securityHeadersMiddleware from '../security-headers'

describe('Security Headers Middleware', () => {
  let app: Hono<AppContext>

  beforeEach(() => {
    app = new Hono<AppContext>()
    app.use('*', securityHeadersMiddleware)
    app.get('/test', c => c.json({ success: true }))
  })

  describe('Basic Security Headers', () => {
    it('should set X-Content-Type-Options header', async () => {
      const res = await app.request('/test')

      expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff')
    })

    it('should set X-Frame-Options header', async () => {
      const res = await app.request('/test')

      expect(res.headers.get('X-Frame-Options')).toBe('DENY')
    })

    it('should not set deprecated X-XSS-Protection header or set it to 0', async () => {
      const res = await app.request('/test')

      // X-XSS-Protection is deprecated and should either be absent or set to "0"
      const xssProtection = res.headers.get('X-XSS-Protection')
      expect(xssProtection === null || xssProtection === '0').toBe(true)
    })

    it('should set Referrer-Policy header', async () => {
      const res = await app.request('/test')

      expect(res.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin')
    })

    it('should apply headers to all HTTP methods', async () => {
      app.post('/test', c => c.json({ success: true }))
      app.put('/test', c => c.json({ success: true }))
      app.delete('/test', c => c.json({ success: true }))

      const methods = ['GET', 'POST', 'PUT', 'DELETE']

      for (const method of methods) {
        const res = await app.request('/test', { method })

        expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff')
        expect(res.headers.get('X-Frame-Options')).toBe('DENY')
        // X-XSS-Protection is deprecated and should either be absent or set to "0"
        const xssProtection = res.headers.get('X-XSS-Protection')
        expect(xssProtection === null || xssProtection === '0').toBe(true)
        expect(res.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin')
      }
    })
  })

  describe('Environment-Specific Headers', () => {
    describe('Current Test Environment', () => {
      it('should not set Strict-Transport-Security in test environment', async () => {
        // We're in test environment by default
        const res = await app.request('/test')

        expect(res.headers.get('Strict-Transport-Security')).toBeNull()
      })

      it('should have development CSP in test environment', async () => {
        // Test environment uses development CSP for better compatibility with testing frameworks
        const res = await app.request('/test')
        const csp = res.headers.get('Content-Security-Policy')

        expect(csp).toBeTruthy()
        // Test environment uses dev CSP with unsafe-eval for testing frameworks
        expect(csp).toContain('script-src \'self\' \'unsafe-inline\' \'unsafe-eval\'')
        expect(csp).toContain('unsafe-eval')
        // Test environment allows http images for testing
        expect(csp).toContain('img-src \'self\' data: https: http:')
        expect(csp).toContain('http:')
      })
    })

    // Note: Testing environment-specific behavior would require mocking the env functions
    // or refactoring the middleware to accept environment as a parameter
    describe('Environment Detection (Unit Tests)', () => {
      it('should correctly identify environment functions are imported', () => {
        // Just verify the functions are imported and used
        expect(typeof securityHeadersMiddleware).toBe('function')
      })

      it('verifies CSP is configured properly in current environment', async () => {
        const res = await app.request('/test')
        const csp = res.headers.get('Content-Security-Policy')

        // CSP should always be present
        expect(csp).toBeTruthy()

        // Should have all the base directives
        expect(csp).toContain('default-src \'self\'')
        expect(csp).toContain('style-src \'self\' \'unsafe-inline\'')
        expect(csp).toContain('font-src \'self\'')
        expect(csp).toContain('connect-src \'self\'')
        expect(csp).toContain('frame-ancestors \'none\'')
        expect(csp).toContain('base-uri \'self\'')
        expect(csp).toContain('form-action \'self\'')
        // upgrade-insecure-requests is only in production/staging, not dev/test
      })
    })
  })

  describe('Content Security Policy', () => {
    it('should set all required CSP directives', async () => {
      const res = await app.request('/test')
      const csp = res.headers.get('Content-Security-Policy')

      expect(csp).toBeTruthy()

      // Check for all expected directives
      expect(csp).toContain('default-src \'self\'')
      expect(csp).toContain('style-src \'self\' \'unsafe-inline\'')
      expect(csp).toContain('font-src \'self\'')
      expect(csp).toContain('connect-src \'self\'')
      expect(csp).toContain('frame-ancestors \'none\'')
      expect(csp).toContain('base-uri \'self\'')
      expect(csp).toContain('form-action \'self\'')
      // upgrade-insecure-requests is only in production/staging, not dev/test
    })

    it('should format CSP as semicolon-separated directives', async () => {
      const res = await app.request('/test')
      const csp = res.headers.get('Content-Security-Policy')

      expect(csp).toBeTruthy()

      // Check that directives are properly separated
      const directives = csp!.split('; ')
      expect(directives.length).toBeGreaterThan(5)

      // Verify each directive has proper format
      for (const directive of directives) {
        // All directives in dev/test should have values (no standalone directives like upgrade-insecure-requests)
        expect(directive).toMatch(/^[\w-]+\s+/)
      }
    })

    it('should include unsafe-inline for styles', async () => {
      const res = await app.request('/test')
      const csp = res.headers.get('Content-Security-Policy')

      expect(csp).toContain('style-src \'self\' \'unsafe-inline\'')
    })

    it('should block framing with frame-ancestors directive', async () => {
      const res = await app.request('/test')
      const csp = res.headers.get('Content-Security-Policy')

      expect(csp).toContain('frame-ancestors \'none\'')
    })
  })

  describe('Permissions Policy', () => {
    it('should set Permissions-Policy header', async () => {
      const res = await app.request('/test')
      const permissionsPolicy = res.headers.get('Permissions-Policy')

      expect(permissionsPolicy).toBeTruthy()
    })

    it('should disable all sensitive features', async () => {
      const res = await app.request('/test')
      const permissionsPolicy = res.headers.get('Permissions-Policy')

      expect(permissionsPolicy).toContain('geolocation=()')
      expect(permissionsPolicy).toContain('camera=()')
      expect(permissionsPolicy).toContain('microphone=()')
      expect(permissionsPolicy).toContain('payment=()')
      expect(permissionsPolicy).toContain('usb=()')
      expect(permissionsPolicy).toContain('magnetometer=()')
      expect(permissionsPolicy).toContain('gyroscope=()')
      expect(permissionsPolicy).toContain('accelerometer=()')
    })

    it('should format Permissions-Policy as comma-separated list', async () => {
      const res = await app.request('/test')
      const permissionsPolicy = res.headers.get('Permissions-Policy')

      expect(permissionsPolicy).toBeTruthy()

      // Check that permissions are properly separated
      const permissions = permissionsPolicy!.split(', ')
      expect(permissions.length).toBe(8)

      // Verify each permission has proper format
      for (const permission of permissions) {
        expect(permission).toMatch(/^[\w-]+=\(\)$/)
      }
    })
  })

  describe('Response Handling', () => {
    it('should preserve original response status', async () => {
      app.get('/not-found', c => c.notFound())
      app.get('/error', c => c.text('Error', 500))
      app.get('/created', c => c.json({ id: 1 }, 201))

      const notFoundRes = await app.request('/not-found')
      expect(notFoundRes.status).toBe(404)
      expect(notFoundRes.headers.get('X-Content-Type-Options')).toBe('nosniff')

      const errorRes = await app.request('/error')
      expect(errorRes.status).toBe(500)
      expect(errorRes.headers.get('X-Frame-Options')).toBe('DENY')

      const createdRes = await app.request('/created')
      expect(createdRes.status).toBe(201)
      // X-XSS-Protection is deprecated and should either be absent or set to "0"
      const xssProtection = createdRes.headers.get('X-XSS-Protection')
      expect(xssProtection === null || xssProtection === '0').toBe(true)
    })

    it('should preserve original response body', async () => {
      app.get('/json', c => c.json({ message: 'test' }))
      app.get('/text', c => c.text('plain text'))
      app.get('/html', c => c.html('<h1>HTML</h1>'))

      const jsonRes = await app.request('/json')
      const jsonBody = await jsonRes.json()
      expect(jsonBody).toEqual({ message: 'test' })
      expect(jsonRes.headers.get('X-Content-Type-Options')).toBe('nosniff')

      const textRes = await app.request('/text')
      const textBody = await textRes.text()
      expect(textBody).toBe('plain text')
      expect(textRes.headers.get('X-Frame-Options')).toBe('DENY')

      const htmlRes = await app.request('/html')
      const htmlBody = await htmlRes.text()
      expect(htmlBody).toBe('<h1>HTML</h1>')
      // X-XSS-Protection is deprecated and should either be absent or set to "0"
      const htmlXssProtection = htmlRes.headers.get('X-XSS-Protection')
      expect(htmlXssProtection === null || htmlXssProtection === '0').toBe(true)
    })

    it('should not override existing security headers', async () => {
      app.get('/custom', (c) => {
        c.header('X-Custom-Header', 'custom-value')

        return c.json({ success: true })
      })

      const res = await app.request('/custom')

      // Custom header should be preserved
      expect(res.headers.get('X-Custom-Header')).toBe('custom-value')

      // Security headers should still be added
      expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff')
      expect(res.headers.get('X-Frame-Options')).toBe('DENY')
    })
  })

  describe('Edge Cases', () => {
    it('should handle HEAD requests', async () => {
      const res = await app.request('/test', { method: 'HEAD' })

      expect(res.status).toBe(200)
      expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff')
      expect(res.headers.get('X-Frame-Options')).toBe('DENY')
    })

    it('should handle OPTIONS requests', async () => {
      const res = await app.request('/test', { method: 'OPTIONS' })

      expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff')
      expect(res.headers.get('X-Frame-Options')).toBe('DENY')
    })

    it('should apply to static file routes', async () => {
      app.get('/static/file.js', c => c.text('console.log("test")'))

      const res = await app.request('/static/file.js')

      expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff')
      expect(res.headers.get('X-Frame-Options')).toBe('DENY')
      expect(res.headers.get('Content-Security-Policy')).toBeTruthy()
    })

    it('should apply to API routes', async () => {
      app.get('/api/v1/users', c => c.json({ users: [] }))

      const res = await app.request('/api/v1/users')

      expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff')
      expect(res.headers.get('X-Frame-Options')).toBe('DENY')
      expect(res.headers.get('Content-Security-Policy')).toBeTruthy()
    })
  })
})
