import { beforeEach, describe, expect, it } from 'bun:test'

import BcryptPasswordEncoder from '../password-encoder-bcrypt'

describe('password encoder', () => {
  let encoder: BcryptPasswordEncoder

  beforeEach(() => {
    encoder = new BcryptPasswordEncoder()
  })

  describe('hash', () => {
    it('should hash a normal password', async () => {
      const plainPassword = 'password123'
      const hashedPassword = await encoder.hash(plainPassword)

      expect(hashedPassword).toBeDefined()
      expect(hashedPassword).not.toBe(plainPassword)
      expect(hashedPassword.length).toBeGreaterThan(50)
      expect(hashedPassword.startsWith('$2b$10$')).toBe(true)
    })

    it('should hash an empty string', async () => {
      const plainPassword = ''
      const hashedPassword = await encoder.hash(plainPassword)

      expect(hashedPassword).toBeDefined()
      expect(hashedPassword).not.toBe(plainPassword)
      expect(hashedPassword.startsWith('$2b$10$')).toBe(true)
    })

    it('should hash a long password', async () => {
      const plainPassword = 'a'.repeat(1000)
      const hashedPassword = await encoder.hash(plainPassword)

      expect(hashedPassword).toBeDefined()
      expect(hashedPassword).not.toBe(plainPassword)
      expect(hashedPassword.startsWith('$2b$10$')).toBe(true)
    })

    it('should produce different hashes for the same password', async () => {
      const plainPassword = 'samePassword'
      const hash1 = await encoder.hash(plainPassword)
      const hash2 = await encoder.hash(plainPassword)

      expect(hash1).not.toBe(hash2)
    })

    it('should hash special characters', async () => {
      const plainPassword = '!@#$%^&*()_+[]{}|;:,.<>?'
      const hashedPassword = await encoder.hash(plainPassword)

      expect(hashedPassword).toBeDefined()
      expect(hashedPassword).not.toBe(plainPassword)
      expect(hashedPassword.startsWith('$2b$10$')).toBe(true)
    })
  })

  describe('compare', () => {
    it('should return true for matching password', async () => {
      const plainPassword = 'testPassword123'
      const hashedPassword = await encoder.hash(plainPassword)

      const isMatch = await encoder.compare(plainPassword, hashedPassword)

      expect(isMatch).toBe(true)
    })

    it('should return false for non-matching password', async () => {
      const plainPassword = 'testPassword123'
      const wrongPassword = 'wrongPassword456'
      const hashedPassword = await encoder.hash(plainPassword)

      const isMatch = await encoder.compare(wrongPassword, hashedPassword)

      expect(isMatch).toBe(false)
    })

    it('should return false for empty password against hashed password', async () => {
      const plainPassword = 'testPassword123'
      const hashedPassword = await encoder.hash(plainPassword)

      const isMatch = await encoder.compare('', hashedPassword)

      expect(isMatch).toBe(false)
    })

    it('should return true for empty password against empty password hash', async () => {
      const plainPassword = ''
      const hashedPassword = await encoder.hash(plainPassword)

      const isMatch = await encoder.compare('', hashedPassword)

      expect(isMatch).toBe(true)
    })

    it('should return false for invalid hash format', async () => {
      const plainPassword = 'testPassword123'
      const invalidHash = 'invalid-hash-format'

      const isMatch = await encoder.compare(plainPassword, invalidHash)

      expect(isMatch).toBe(false)
    })

    it('should handle special characters correctly', async () => {
      const plainPassword = '!@#$%^&*()_+[]{}|;:,.<>?'
      const hashedPassword = await encoder.hash(plainPassword)

      const isMatch = await encoder.compare(plainPassword, hashedPassword)

      expect(isMatch).toBe(true)
    })

    it('should be case sensitive', async () => {
      const plainPassword = 'TestPassword123'
      const hashedPassword = await encoder.hash(plainPassword)

      const isMatch = await encoder.compare('testpassword123', hashedPassword)

      expect(isMatch).toBe(false)
    })
  })
})
