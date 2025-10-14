import { describe, expect, it } from 'bun:test'

import BcryptHasher from '../hasher-bcrypt'

describe('Hasher', () => {
  const hasher = new BcryptHasher()

  describe('hash', () => {
    it('should hash a normal string', async () => {
      const plainText = 'password123'
      const hashedText = await hasher.hash(plainText)

      expect(hashedText).toBeDefined()
      expect(hashedText).not.toBe(plainText)
      expect(hashedText.length).toBeGreaterThan(50)
      expect(hashedText.startsWith('$2b$10$')).toBe(true)
    })

    it('should hash an empty string', async () => {
      const plainText = ''
      const hashedText = await hasher.hash(plainText)

      expect(hashedText).toBeDefined()
      expect(hashedText).not.toBe(plainText)
      expect(hashedText.startsWith('$2b$10$')).toBe(true)
    })

    it('should hash a long string', async () => {
      const plainText = 'a'.repeat(1000)
      const hashedText = await hasher.hash(plainText)

      expect(hashedText).toBeDefined()
      expect(hashedText).not.toBe(plainText)
      expect(hashedText.startsWith('$2b$10$')).toBe(true)
    })

    it('should produce different hashes for the same string', async () => {
      const plainText = 'sameText'
      const hash1 = await hasher.hash(plainText)
      const hash2 = await hasher.hash(plainText)

      expect(hash1).not.toBe(hash2)
    })

    it('should hash special characters', async () => {
      const plainText = '!@#$%^&*()_+[]{}|;:,.<>?'
      const hashedText = await hasher.hash(plainText)

      expect(hashedText).toBeDefined()
      expect(hashedText).not.toBe(plainText)
      expect(hashedText.startsWith('$2b$10$')).toBe(true)
    })
  })

  describe('compare', () => {
    it('should return true for matching text', async () => {
      const plainText = 'testPassword123'
      const hashedText = await hasher.hash(plainText)

      const isMatch = await hasher.compare(plainText, hashedText)

      expect(isMatch).toBe(true)
    })

    it('should return false for non-matching text', async () => {
      const plainText = 'testPassword123'
      const wrongText = 'wrongPassword456'
      const hashedText = await hasher.hash(plainText)

      const isMatch = await hasher.compare(wrongText, hashedText)

      expect(isMatch).toBe(false)
    })

    it('should return false for empty text against hashed text', async () => {
      const plainText = 'testPassword123'
      const hashedText = await hasher.hash(plainText)

      const isMatch = await hasher.compare('', hashedText)

      expect(isMatch).toBe(false)
    })

    it('should return true for empty text against empty text hash', async () => {
      const plainText = ''
      const hashedText = await hasher.hash(plainText)

      const isMatch = await hasher.compare('', hashedText)

      expect(isMatch).toBe(true)
    })

    it('should return false for invalid hash format', async () => {
      const plainText = 'testPassword123'
      const invalidHash = 'invalid-hash-format'

      const isMatch = await hasher.compare(plainText, invalidHash)

      expect(isMatch).toBe(false)
    })

    it('should handle special characters correctly', async () => {
      const plainText = '!@#$%^&*()_+[]{}|;:,.<>?'
      const hashedText = await hasher.hash(plainText)

      const isMatch = await hasher.compare(plainText, hashedText)

      expect(isMatch).toBe(true)
    })

    it('should be case sensitive', async () => {
      const plainText = 'TestPassword123'
      const hashedText = await hasher.hash(plainText)

      const isMatch = await hasher.compare('testpassword123', hashedText)

      expect(isMatch).toBe(false)
    })
  })
})
