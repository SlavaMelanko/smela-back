import { beforeEach, describe, expect, it } from 'bun:test'

import { createRandomBytesGenerator } from '../factory'
import CryptoRandomBytesGenerator from '../random-bytes-generator-crypto'

describe('random bytes generator', () => {
  let generator: CryptoRandomBytesGenerator

  beforeEach(() => {
    generator = new CryptoRandomBytesGenerator()
  })

  describe('CryptoRandomBytesGenerator', () => {
    describe('generate', () => {
      it('should generate random bytes with specified length', () => {
        const numberOfBytes = 16
        const result = generator.generate(numberOfBytes)

        expect(result).toBeDefined()
        expect(typeof result).toBe('string')
        expect(result.length).toBe(numberOfBytes * 2) // hex string is 2 chars per byte
        expect(/^[0-9a-f]+$/.test(result)).toBe(true)
      })

      it('should generate different results on consecutive calls', () => {
        const numberOfBytes = 8
        const result1 = generator.generate(numberOfBytes)
        const result2 = generator.generate(numberOfBytes)

        expect(result1).not.toBe(result2)
        expect(result1.length).toBe(result2.length)
      })

      it('should handle minimum byte count', () => {
        const numberOfBytes = 1
        const result = generator.generate(numberOfBytes)

        expect(result.length).toBe(2) // 1 byte = 2 hex chars
        expect(/^[0-9a-f]+$/.test(result)).toBe(true)
      })

      it('should handle large byte counts', () => {
        const numberOfBytes = 256
        const result = generator.generate(numberOfBytes)

        expect(result.length).toBe(512) // 256 bytes = 512 hex chars
        expect(/^[0-9a-f]+$/.test(result)).toBe(true)
      })

      it('should handle zero bytes', () => {
        const numberOfBytes = 0
        const result = generator.generate(numberOfBytes)

        expect(result).toBe('')
      })

      it('should only contain hexadecimal characters', () => {
        const numberOfBytes = 32
        const result = generator.generate(numberOfBytes)
        const hexRegex = /^[0-9a-f]+$/

        expect(hexRegex.test(result)).toBe(true)
      })

      it('should generate cryptographically random data', () => {
        const numberOfBytes = 16
        const results = new Set()

        // Generate multiple random values and ensure they're all different
        for (let i = 0; i < 100; i++) {
          const result = generator.generate(numberOfBytes)
          results.add(result)
        }

        // Should have close to 100 unique values (allowing for extremely rare collisions)
        expect(results.size).toBeGreaterThanOrEqual(99)
      })

      it('should handle fractional byte counts by truncating', () => {
        const numberOfBytes = 5.7
        const result = generator.generate(numberOfBytes)

        // Should truncate to 5 bytes
        expect(result.length).toBe(10) // 5 bytes = 10 hex chars
        expect(/^[0-9a-f]+$/.test(result)).toBe(true)
      })
    })
  })

  describe('createRandomBytesGenerator factory', () => {
    it('should create a CryptoRandomBytesGenerator by default', () => {
      const factoryGenerator = createRandomBytesGenerator()

      expect(factoryGenerator).toBeDefined()
      expect(typeof factoryGenerator.generate).toBe('function')
    })

    it('should create a CryptoRandomBytesGenerator with crypto implementation', () => {
      const factoryGenerator = createRandomBytesGenerator('crypto')

      expect(factoryGenerator).toBeDefined()
      expect(typeof factoryGenerator.generate).toBe('function')
    })

    it('should throw error for unknown implementation', () => {
      expect(() => {
        // @ts-expect-error - testing invalid implementation
        createRandomBytesGenerator('invalid')
      }).toThrow('Unknown random bytes generator: invalid')
    })

    it('should generate same format as direct instantiation', () => {
      const directGenerator = new CryptoRandomBytesGenerator()
      const factoryGenerator = createRandomBytesGenerator()

      const numberOfBytes = 16
      const directResult = directGenerator.generate(numberOfBytes)
      const factoryResult = factoryGenerator.generate(numberOfBytes)

      expect(directResult.length).toBe(factoryResult.length)
      expect(/^[0-9a-f]+$/.test(directResult)).toBe(true)
      expect(/^[0-9a-f]+$/.test(factoryResult)).toBe(true)
    })

    it('should create independent instances', () => {
      const generator1 = createRandomBytesGenerator()
      const generator2 = createRandomBytesGenerator()

      const numberOfBytes = 8
      const result1 = generator1.generate(numberOfBytes)
      const result2 = generator2.generate(numberOfBytes)

      // Should be different instances generating different values
      expect(result1).not.toBe(result2)
    })
  })
})
