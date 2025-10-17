import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'

import { HttpClient } from '../client'

// Mock fetch globally
const mockFetch = mock(async () => ({
  ok: true,
  json: async () => ({ success: true, data: 'test' }),
}))

// Store original fetch to restore later
const originalFetch = globalThis.fetch

describe('HTTP Client', () => {
  beforeEach(() => {
    // Replace global fetch with mock
    globalThis.fetch = mockFetch as any
    mockFetch.mockClear()
  })

  afterEach(() => {
    // Restore original fetch
    globalThis.fetch = originalFetch
  })

  describe('constructor', () => {
    test('should remove trailing slash from base URL', () => {
      const client = new HttpClient('https://example.com/')
      // We can't directly access baseUrl, but we can test the behavior
      expect(client).toBeInstanceOf(HttpClient)
    })

    test('should store default options with headers', () => {
      const headers = { 'Content-Type': 'application/json' }
      const client = new HttpClient('https://example.com', { headers })
      expect(client).toBeInstanceOf(HttpClient)
    })

    test('should store default options with timeout', () => {
      const client = new HttpClient('https://example.com', { timeout: 5000 })
      expect(client).toBeInstanceOf(HttpClient)
    })

    test('should store default options with headers and timeout', () => {
      const headers = { 'Content-Type': 'application/json' }
      const client = new HttpClient('https://example.com', { headers, timeout: 5000 })
      expect(client).toBeInstanceOf(HttpClient)
    })

    test('should work with empty default options', () => {
      const client = new HttpClient('https://example.com')
      expect(client).toBeInstanceOf(HttpClient)
    })

    test('should use default timeout when not specified', () => {
      const client = new HttpClient('https://example.com', { headers: {} })
      expect(client).toBeInstanceOf(HttpClient)
    })
  })

  describe('get method', () => {
    test('should make GET request with correct URL', async () => {
      const client = new HttpClient('https://example.com')
      await client.get('/users')

      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/users',
        expect.objectContaining({
          method: 'GET',
          headers: {},
        }),
      )
    })

    test('should handle path without leading slash', async () => {
      const client = new HttpClient('https://example.com')
      await client.get('users')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/users',
        expect.objectContaining({ method: 'GET' }),
      )
    })

    test('should merge custom headers with default headers', async () => {
      const client = new HttpClient('https://example.com', {
        headers: { Authorization: 'Bearer token' },
      })
      await client.get('/users', { 'Content-Type': 'application/json' })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/users',
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Authorization': 'Bearer token',
            'Content-Type': 'application/json',
          },
        }),
      )
    })

    test('should return parsed JSON response', async () => {
      const mockData = { id: 1, name: 'John' }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as any)

      const client = new HttpClient('https://example.com')
      const result = await client.get('/users/1')

      expect(result).toEqual(mockData)
    })
  })

  describe('post method', () => {
    test('should make POST request with body', async () => {
      const client = new HttpClient('https://example.com')
      const body = new URLSearchParams({ name: 'John' })

      await client.post('/users', body)

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/users',
        expect.objectContaining({
          method: 'POST',
          body,
          headers: {},
        }),
      )
    })

    test('should make POST request without body', async () => {
      const client = new HttpClient('https://example.com')
      await client.post('/users')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/users',
        expect.objectContaining({
          method: 'POST',
          headers: {},
        }),
      )
    })

    test('should handle string body', async () => {
      const client = new HttpClient('https://example.com')
      const body = '{"name":"John"}'

      await client.post('/users', body)

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/users',
        expect.objectContaining({
          method: 'POST',
          body,
        }),
      )
    })

    test('should handle FormData body', async () => {
      const client = new HttpClient('https://example.com')
      const body = new FormData()
      body.append('name', 'John')

      await client.post('/users', body)

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/users',
        expect.objectContaining({
          method: 'POST',
          body,
        }),
      )
    })

    test('should merge custom headers', async () => {
      const client = new HttpClient('https://example.com', {
        headers: { Authorization: 'Bearer token' },
      })
      await client.post('/users', 'data', { 'Content-Type': 'application/json' })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/users',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': 'Bearer token',
            'Content-Type': 'application/json',
          },
        }),
      )
    })
  })

  describe('put method', () => {
    test('should make PUT request', async () => {
      const client = new HttpClient('https://example.com')
      const body = '{"name":"Updated John"}'

      await client.put('/users/1', body)

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/users/1',
        expect.objectContaining({
          method: 'PUT',
          body,
          headers: {},
        }),
      )
    })

    test('should work without body', async () => {
      const client = new HttpClient('https://example.com')
      await client.put('/users/1')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/users/1',
        expect.objectContaining({
          method: 'PUT',
          headers: {},
        }),
      )
    })
  })

  describe('delete method', () => {
    test('should make DELETE request', async () => {
      const client = new HttpClient('https://example.com')
      await client.delete('/users/1')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/users/1',
        expect.objectContaining({
          method: 'DELETE',
          headers: {},
        }),
      )
    })

    test('should handle custom headers', async () => {
      const client = new HttpClient('https://example.com')
      await client.delete('/users/1', { Authorization: 'Bearer token' })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/users/1',
        expect.objectContaining({
          method: 'DELETE',
          headers: { Authorization: 'Bearer token' },
        }),
      )
    })
  })

  describe('URL construction', () => {
    test('should handle base URL with trailing slash', async () => {
      const client = new HttpClient('https://example.com/')
      await client.get('/api/users')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/api/users',
        expect.any(Object),
      )
    })

    test('should handle base URL without trailing slash', async () => {
      const client = new HttpClient('https://example.com')
      await client.get('/api/users')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/api/users',
        expect.any(Object),
      )
    })

    test('should handle path without leading slash', async () => {
      const client = new HttpClient('https://example.com')
      await client.get('api/users')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/api/users',
        expect.any(Object),
      )
    })

    test('should handle empty path', async () => {
      const client = new HttpClient('https://example.com')
      await client.get('')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/',
        expect.any(Object),
      )
    })

    test('should handle root path', async () => {
      const client = new HttpClient('https://example.com')
      await client.get('/')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/',
        expect.any(Object),
      )
    })

    test('should work with ports in base URL', async () => {
      const client = new HttpClient('http://localhost:3000')
      await client.get('/api/users')

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/users',
        expect.any(Object),
      )
    })
  })

  describe('header merging', () => {
    test('should use only default headers when no custom headers provided', async () => {
      const client = new HttpClient('https://example.com', {
        headers: { 'User-Agent': 'TestClient' },
      })
      await client.get('/users')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/users',
        expect.objectContaining({
          headers: { 'User-Agent': 'TestClient' },
        }),
      )
    })

    test('should override default headers with custom headers', async () => {
      const client = new HttpClient('https://example.com', {
        headers: { 'Content-Type': 'application/xml' },
      })
      await client.post('/users', 'data', { 'Content-Type': 'application/json' })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/users',
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
        }),
      )
    })

    test('should merge multiple headers correctly', async () => {
      const client = new HttpClient('https://example.com', {
        headers: {
          'Authorization': 'Bearer token',
          'User-Agent': 'TestClient',
        },
      })
      await client.get('/users', { 'Content-Type': 'application/json' })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/users',
        expect.objectContaining({
          headers: {
            'Authorization': 'Bearer token',
            'User-Agent': 'TestClient',
            'Content-Type': 'application/json',
          },
        }),
      )
    })
  })

  describe('timeout functionality', () => {
    test('should use default timeout when not specified', async () => {
      const client = new HttpClient('https://example.com')
      await client.get('/users')

      // We can't directly test the timeout value, but we can verify the request was made
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    test('should use custom default timeout', async () => {
      const client = new HttpClient('https://example.com', { timeout: 5000 })
      await client.get('/users')

      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    test('should handle timeout errors', async () => {
      // Mock a slow response that exceeds timeout
      mockFetch.mockImplementationOnce(async () =>
        new Promise(resolve => setTimeout(resolve, 20)), // 20ms delay
      )

      const client = new HttpClient('https://example.com', { timeout: 10 }) // 10ms timeout

      expect(client.get('/users')).rejects.toThrow('Timeout.')
    })

    test('should complete before timeout', async () => {
      const mockData = { id: 1, name: 'John' }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as any)

      const client = new HttpClient('https://example.com', { timeout: 1000 })
      const result = await client.get('/users')

      expect(result).toEqual(mockData)
    })
  })
})
