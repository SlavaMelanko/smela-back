import { describe, expect, it } from 'bun:test'

import BcryptHasher from '../hasher-bcrypt'

describe('BcryptHasher', () => {
  const hasher = new BcryptHasher()

  it('should hash a string with bcrypt format', async () => {
    const plainText = 'password123'
    const hashedText = await hasher.hash(plainText)

    expect(hashedText).toBeDefined()
    expect(hashedText).not.toBe(plainText)
    expect(hashedText.length).toBeGreaterThan(50)
    expect(hashedText.startsWith('$2b$10$')).toBe(true)
  })

  it('should produce different hashes for the same string due to salt', async () => {
    const plainText = 'sameText'
    const hash1 = await hasher.hash(plainText)
    const hash2 = await hasher.hash(plainText)

    expect(hash1).not.toBe(hash2)
  })

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

  it('should hash with custom salt rounds', async () => {
    const hasher12 = new BcryptHasher(12)
    const plainText = 'password123'
    const hashedText = await hasher12.hash(plainText)

    expect(hashedText).toBeDefined()
    expect(hashedText).not.toBe(plainText)
    expect(hashedText.startsWith('$2b$12$')).toBe(true)
  })
})
