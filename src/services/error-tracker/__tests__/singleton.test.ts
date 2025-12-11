import { describe, expect, it } from 'bun:test'

import { getErrorTracker, initErrorTracker } from '../singleton'

describe('error-tracker/singleton', () => {
  describe('getErrorTracker', () => {
    it('should return an object conforming to ErrorTracker interface', () => {
      const tracker = getErrorTracker()

      expect(typeof tracker.init).toBe('function')
      expect(typeof tracker.captureError).toBe('function')
      expect(typeof tracker.captureMessage).toBe('function')
      expect(typeof tracker.setUser).toBe('function')
      expect(typeof tracker.clearUser).toBe('function')
    })

    it('should return same instance on subsequent calls', () => {
      const tracker1 = getErrorTracker()
      const tracker2 = getErrorTracker()

      expect(tracker1).toBe(tracker2)
    })
  })

  describe('initErrorTracker', () => {
    it('should not throw when called', () => {
      expect(() => initErrorTracker()).not.toThrow()
    })
  })
})
