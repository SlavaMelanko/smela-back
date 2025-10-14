import { describe, expect, it } from 'bun:test'

import CryptoTokenGenerator from '../token-generator-crypto'

describe('Token Generator', () => {
  const generator = new CryptoTokenGenerator()

  describe('generate', () => {
    it('should generate a token with default length', () => {
      const token = generator.generate()

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.length).toBe(64)
      expect(/^[0-9a-f]+$/.test(token)).toBe(true)
    })

    it('should generate different tokens on consecutive calls', () => {
      const token1 = generator.generate()
      const token2 = generator.generate()

      expect(token1).not.toBe(token2)
    })

    it('should generate tokens with custom length', () => {
      const customLength = 32
      const customGenerator = new CryptoTokenGenerator({ tokenLength: customLength })
      const token = customGenerator.generate()

      expect(token.length).toBe(customLength)
      expect(/^[0-9a-f]+$/.test(token)).toBe(true)
    })

    it('should generate token with minimum length', () => {
      const minLength = 2
      const minGenerator = new CryptoTokenGenerator({ tokenLength: minLength })
      const token = minGenerator.generate()

      expect(token.length).toBe(minLength)
      expect(/^[0-9a-f]+$/.test(token)).toBe(true)
    })

    it('should generate token with very long length', () => {
      const longLength = 128
      const longGenerator = new CryptoTokenGenerator({ tokenLength: longLength })
      const token = longGenerator.generate()

      expect(token.length).toBe(longLength)
      expect(/^[0-9a-f]+$/.test(token)).toBe(true)
    })

    it('should only contain hexadecimal characters', () => {
      const token = generator.generate()
      const hexRegex = /^[0-9a-f]+$/

      expect(hexRegex.test(token)).toBe(true)
    })
  })

  describe('generateWithExpiry', () => {
    it('should generate token with expiry date', () => {
      const result = generator.generateWithExpiry()

      expect(result).toBeDefined()
      expect(result.token).toBeDefined()
      expect(result.expiresAt).toBeDefined()
      expect(typeof result.token).toBe('string')
      expect(result.expiresAt).toBeInstanceOf(Date)
      expect(result.token.length).toBe(64)
      expect(/^[0-9a-f]+$/.test(result.token)).toBe(true)
    })

    it('should set expiry date to default hours in the future', () => {
      const beforeGeneration = new Date()
      const result = generator.generateWithExpiry()
      const afterGeneration = new Date()

      const expectedMinExpiry = new Date(beforeGeneration.getTime() + 24 * 60 * 60 * 1000)
      const expectedMaxExpiry = new Date(afterGeneration.getTime() + 24 * 60 * 60 * 1000)

      expect(result.expiresAt.getTime()).toBeGreaterThanOrEqual(expectedMinExpiry.getTime())
      expect(result.expiresAt.getTime()).toBeLessThanOrEqual(expectedMaxExpiry.getTime())
    })

    it('should set expiry date to custom hours in the future', () => {
      const customHours = 12
      const customGenerator = new CryptoTokenGenerator({ expiryHours: customHours })
      const beforeGeneration = new Date()
      const result = customGenerator.generateWithExpiry()
      const afterGeneration = new Date()

      const expectedMinExpiry = new Date(beforeGeneration.getTime() + customHours * 60 * 60 * 1000)
      const expectedMaxExpiry = new Date(afterGeneration.getTime() + customHours * 60 * 60 * 1000)

      expect(result.expiresAt.getTime()).toBeGreaterThanOrEqual(expectedMinExpiry.getTime())
      expect(result.expiresAt.getTime()).toBeLessThanOrEqual(expectedMaxExpiry.getTime())
    })

    it('should generate different tokens on consecutive calls', () => {
      const result1 = generator.generateWithExpiry()
      const result2 = generator.generateWithExpiry()

      expect(result1.token).not.toBe(result2.token)
      expect(result1.expiresAt.getTime()).toBeGreaterThanOrEqual(result2.expiresAt.getTime())
    })

    it('should handle zero expiry hours', () => {
      const zeroHoursGenerator = new CryptoTokenGenerator({ expiryHours: 0 })
      const beforeGeneration = new Date()
      const result = zeroHoursGenerator.generateWithExpiry()
      const afterGeneration = new Date()

      expect(result.expiresAt.getTime()).toBeGreaterThanOrEqual(beforeGeneration.getTime())
      expect(result.expiresAt.getTime()).toBeLessThanOrEqual(afterGeneration.getTime())
    })

    it('should handle negative expiry hours', () => {
      const negativeHoursGenerator = new CryptoTokenGenerator({ expiryHours: -1 })
      const beforeGeneration = new Date()
      const result = negativeHoursGenerator.generateWithExpiry()
      const afterGeneration = new Date()

      const expectedMinExpiry = new Date(beforeGeneration.getTime() - 60 * 60 * 1000)
      const expectedMaxExpiry = new Date(afterGeneration.getTime() - 60 * 60 * 1000)

      expect(result.expiresAt.getTime()).toBeGreaterThanOrEqual(expectedMinExpiry.getTime())
      expect(result.expiresAt.getTime()).toBeLessThanOrEqual(expectedMaxExpiry.getTime())
    })
  })

  describe('constructor', () => {
    it('should use default values when no parameters provided', () => {
      const defaultGenerator = new CryptoTokenGenerator()
      const token = defaultGenerator.generate()

      expect(token.length).toBe(64)
    })

    it('should accept custom token length', () => {
      const customLength = 16
      const customGenerator = new CryptoTokenGenerator({ tokenLength: customLength })
      const token = customGenerator.generate()

      expect(token.length).toBe(customLength)
    })

    it('should accept custom expiry hours', () => {
      const customHours = 6
      const customGenerator = new CryptoTokenGenerator({ expiryHours: customHours })
      const beforeGeneration = new Date()
      const result = customGenerator.generateWithExpiry()
      const afterGeneration = new Date()

      const expectedMinExpiry = new Date(beforeGeneration.getTime() + customHours * 60 * 60 * 1000)
      const expectedMaxExpiry = new Date(afterGeneration.getTime() + customHours * 60 * 60 * 1000)

      expect(result.expiresAt.getTime()).toBeGreaterThanOrEqual(expectedMinExpiry.getTime())
      expect(result.expiresAt.getTime()).toBeLessThanOrEqual(expectedMaxExpiry.getTime())
    })
  })
})
