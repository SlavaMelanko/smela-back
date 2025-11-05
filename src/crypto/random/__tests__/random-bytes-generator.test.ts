import { describe, expect, it } from 'bun:test'

import NodeRandomBytesGenerator from '../random-bytes-generator-node'

describe('NodeRandomBytesGenerator', () => {
  const generator = new NodeRandomBytesGenerator()

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

    it('should generate hex encoding by default', () => {
      const numberOfBytes = 16
      const result = generator.generate(numberOfBytes)

      expect(result.length).toBe(numberOfBytes * 2) // hex string is 2 chars per byte
      expect(/^[0-9a-f]+$/.test(result)).toBe(true)
    })

    it('should generate base64 encoding', () => {
      const numberOfBytes = 16
      const result = generator.generate(numberOfBytes, 'base64')

      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
      expect(/^[A-Z0-9+/]+=*$/i.test(result)).toBe(true)
    })
  })
})
