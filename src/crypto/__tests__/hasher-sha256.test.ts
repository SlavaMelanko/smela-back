import { describe, expect, it } from 'bun:test'

import Sha256Hasher from '../hasher-sha256'

describe('Sha256Hasher', () => {
  const hasher = new Sha256Hasher()

  describe('hash', () => {
    it('should hash a normal string with SHA-256 hex format', async () => {
      const plainText = 'password123'
      const hashedText = await hasher.hash(plainText)

      expect(hashedText).toBeDefined()
      expect(hashedText).not.toBe(plainText)
      expect(hashedText.length).toBe(64) // SHA-256 produces 64 hex characters
      expect(hashedText).toMatch(/^[a-f0-9]{64}$/) // hex format
    })

    it('should hash an empty string', async () => {
      const plainText = ''
      const hashedText = await hasher.hash(plainText)

      expect(hashedText).toBeDefined()
      expect(hashedText).not.toBe(plainText)
      expect(hashedText.length).toBe(64)
    })

    it('should hash a long string', async () => {
      const plainText = 'a'.repeat(1000)
      const hashedText = await hasher.hash(plainText)

      expect(hashedText).toBeDefined()
      expect(hashedText).not.toBe(plainText)
      expect(hashedText.length).toBe(64)
    })

    it('should produce identical hashes for the same string', async () => {
      const plainText = 'sameText'
      const hash1 = await hasher.hash(plainText)
      const hash2 = await hasher.hash(plainText)

      expect(hash1).toBe(hash2) // SHA-256 is deterministic
    })

    it('should hash special characters', async () => {
      const plainText = '!@#$%^&*()_+[]{}|;:,.<>?'
      const hashedText = await hasher.hash(plainText)

      expect(hashedText).toBeDefined()
      expect(hashedText).not.toBe(plainText)
      expect(hashedText.length).toBe(64)
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
