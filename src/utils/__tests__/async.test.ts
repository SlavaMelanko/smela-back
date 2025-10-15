import { describe, expect, test } from 'bun:test'

import { exponentialBackoffDelay, sleepFor, withTimeout } from '../async'

describe('Async Utils', () => {
  describe('withTimeout', () => {
    test('should resolve when operation completes within timeout', async () => {
      const result = await withTimeout(
        async () => 'success',
        1000,
      )

      expect(result).toBe('success')
    })

    test('should reject when operation exceeds timeout', async () => {
      const slowOperation = withTimeout(
        async () => {
          await sleepFor(200)

          return 'too slow'
        },
        100,
      )

      expect(slowOperation).rejects.toThrow('Timeout.')
    })
  })

  describe('sleepFor', () => {
    test('should delay execution for specified milliseconds', async () => {
      const start = Date.now()
      await sleepFor(100)
      const elapsed = Date.now() - start

      expect(elapsed).toBeGreaterThanOrEqual(100)
      expect(elapsed).toBeLessThan(150)
    })
  })

  describe('exponentialBackoffDelay', () => {
    test('should calculate exponential backoff correctly', () => {
      expect(exponentialBackoffDelay(1000, 0)).toBe(1000)
      expect(exponentialBackoffDelay(1000, 1)).toBe(2000)
      expect(exponentialBackoffDelay(1000, 2)).toBe(4000)
    })

    test('should cap delay at maxDelayMs when provided', () => {
      expect(exponentialBackoffDelay(1000, 5, 10000)).toBe(10000)
    })
  })
})
