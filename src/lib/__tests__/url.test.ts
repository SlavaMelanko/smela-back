import { describe, expect, test } from 'bun:test'

import { isHTTPS, isLocalhost, isValidOrigin, normalizeOrigin, parseOrigin } from '@/lib/url'

describe('URL utilities', () => {
  describe('isLocalhost', () => {
    test('should return true for localhost addresses', () => {
      expect(isLocalhost('http://localhost')).toBe(true)
      expect(isLocalhost('http://localhost:3000')).toBe(true)
      expect(isLocalhost('http://localhost:8080')).toBe(true)
      expect(isLocalhost('https://localhost')).toBe(true)
      expect(isLocalhost('https://localhost:443')).toBe(true)
    })

    test('should return true for 127.0.0.1 addresses', () => {
      expect(isLocalhost('http://127.0.0.1')).toBe(true)
      expect(isLocalhost('http://127.0.0.1:3000')).toBe(true)
      expect(isLocalhost('http://127.0.0.1:8080')).toBe(true)
    })

    test('should return true for IPv6 localhost [::1]', () => {
      expect(isLocalhost('http://[::1]')).toBe(true)
      expect(isLocalhost('http://[::1]:3000')).toBe(true)
      expect(isLocalhost('http://[::1]:8080')).toBe(true)
    })

    test('should return false for non-localhost addresses', () => {
      expect(isLocalhost('http://example.com')).toBe(false)
      expect(isLocalhost('https://google.com')).toBe(false)
      expect(isLocalhost('http://192.168.1.1')).toBe(false)
      expect(isLocalhost('http://10.0.0.1')).toBe(false)
      expect(isLocalhost('http://localhost.com')).toBe(false)
      expect(isLocalhost('http://notlocalhost')).toBe(false)
    })

    test('should return false for localhost with paths', () => {
      expect(isLocalhost('http://localhost/path')).toBe(false)
      expect(isLocalhost('http://127.0.0.1/api')).toBe(false)
      expect(isLocalhost('http://[::1]/test')).toBe(false)
    })

    test('should return false for localhost with different protocols', () => {
      expect(isLocalhost('ws://localhost')).toBe(false)
      expect(isLocalhost('ftp://localhost')).toBe(false)
      expect(isLocalhost('file://localhost')).toBe(false)
    })
  })

  describe('isHTTPS', () => {
    test('should return true for HTTPS URLs', () => {
      expect(isHTTPS('https://example.com')).toBe(true)
      expect(isHTTPS('https://localhost')).toBe(true)
      expect(isHTTPS('https://api.example.com:8443')).toBe(true)
      expect(isHTTPS('https://192.168.1.1')).toBe(true)
    })

    test('should return false for non-HTTPS URLs', () => {
      expect(isHTTPS('http://example.com')).toBe(false)
      expect(isHTTPS('http://localhost')).toBe(false)
      expect(isHTTPS('ws://example.com')).toBe(false)
      expect(isHTTPS('wss://example.com')).toBe(false)
      expect(isHTTPS('ftp://example.com')).toBe(false)
    })

    test('should return false for invalid or empty strings', () => {
      expect(isHTTPS('')).toBe(false)
      expect(isHTTPS('example.com')).toBe(false)
      expect(isHTTPS('not-a-url')).toBe(false)
    })

    test('should be case-sensitive', () => {
      expect(isHTTPS('HTTPS://example.com')).toBe(false)
      expect(isHTTPS('Https://example.com')).toBe(false)
    })
  })

  describe('parseOrigin', () => {
    test('should parse valid URLs', () => {
      const url1 = parseOrigin('https://example.com')
      expect(url1).not.toBeNull()
      expect(url1?.href).toBe('https://example.com/')
      expect(url1?.origin).toBe('https://example.com')

      const url2 = parseOrigin('http://localhost:3000')
      expect(url2).not.toBeNull()
      expect(url2?.origin).toBe('http://localhost:3000')

      const url3 = parseOrigin('https://api.example.com:8443/path')
      expect(url3).not.toBeNull()
      expect(url3?.origin).toBe('https://api.example.com:8443')
    })

    test('should return null for invalid URLs', () => {
      expect(parseOrigin('')).toBeNull()
      expect(parseOrigin('not-a-url')).toBeNull()
      expect(parseOrigin('example.com')).toBeNull()
      expect(parseOrigin('//example.com')).toBeNull()
      expect(parseOrigin('http://')).toBeNull()
    })

    test('should handle special characters', () => {
      const url = parseOrigin('https://example.com/path?query=value#hash')
      expect(url).not.toBeNull()
      expect(url?.origin).toBe('https://example.com')
      expect(url?.pathname).toBe('/path')
      expect(url?.search).toBe('?query=value')
      expect(url?.hash).toBe('#hash')
    })
  })

  describe('normalizeOrigin', () => {
    test('should normalize valid origins', () => {
      expect(normalizeOrigin('https://EXAMPLE.COM')).toBe('https://example.com')
      expect(normalizeOrigin('HTTP://LOCALHOST:3000')).toBe('http://localhost:3000')
      expect(normalizeOrigin('  https://example.com  ')).toBe('https://example.com')
    })

    test('should remove paths from origins', () => {
      expect(normalizeOrigin('https://example.com/path')).toBe('https://example.com')
      expect(normalizeOrigin('http://localhost:3000/api/v1')).toBe('http://localhost:3000')
      expect(normalizeOrigin('https://api.example.com:8443/test?query=1')).toBe('https://api.example.com:8443')
    })

    test('should handle invalid origins', () => {
      expect(normalizeOrigin('not-a-url')).toBe('not-a-url')
      expect(normalizeOrigin('  invalid  ')).toBe('invalid')
      expect(normalizeOrigin('')).toBe('')
    })

    test('should preserve port numbers', () => {
      expect(normalizeOrigin('https://example.com:8443')).toBe('https://example.com:8443')
      expect(normalizeOrigin('http://localhost:3000')).toBe('http://localhost:3000')
    })

    test('should handle default ports correctly', () => {
      expect(normalizeOrigin('https://example.com:443')).toBe('https://example.com')
      expect(normalizeOrigin('http://example.com:80')).toBe('http://example.com')
    })
  })

  describe('isValidOrigin', () => {
    test('should return true for valid origins', () => {
      expect(isValidOrigin('https://example.com')).toBe(true)
      expect(isValidOrigin('http://localhost')).toBe(true)
      expect(isValidOrigin('http://127.0.0.1')).toBe(true)
      expect(isValidOrigin('https://api.example.com:8443')).toBe(true)
      expect(isValidOrigin('http://[::1]')).toBe(true)
    })

    test('should return false for invalid origins', () => {
      expect(isValidOrigin('')).toBe(false)
      expect(isValidOrigin('not-a-url')).toBe(false)
      expect(isValidOrigin('example.com')).toBe(false)
      expect(isValidOrigin('//example.com')).toBe(false)
      expect(isValidOrigin('http://')).toBe(false)
      expect(isValidOrigin('localhost')).toBe(false)
    })

    test('should accept origins with paths', () => {
      expect(isValidOrigin('https://example.com/path')).toBe(true)
      expect(isValidOrigin('http://localhost:3000/api')).toBe(true)
    })

    test('should accept origins with query strings and hashes', () => {
      expect(isValidOrigin('https://example.com?query=value')).toBe(true)
      expect(isValidOrigin('https://example.com#section')).toBe(true)
      expect(isValidOrigin('https://example.com/path?query=value#section')).toBe(true)
    })
  })
})
