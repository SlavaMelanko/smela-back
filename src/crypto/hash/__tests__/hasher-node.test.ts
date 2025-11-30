import { describe, expect, it } from 'bun:test'

import NodeHasher from '../hasher-node'

describe('NodeHasher', () => {
  it('should hash with SHA-256 hex format', async () => {
    const hasher = new NodeHasher('sha256')
    const plainText = 'password123'
    const hashedText = await hasher.hash(plainText)

    expect(hashedText).toBeDefined()
    expect(hashedText).not.toBe(plainText)
    expect(hashedText.length).toBe(64) // SHA-256 produces 64 hex characters
    expect(hashedText).toMatch(/^[a-f0-9]{64}$/)
  })

  it('should hash with SHA-512 base64 format', async () => {
    const hasher = new NodeHasher('sha512', 'base64')
    const plainText = 'password123'
    const hashedText = await hasher.hash(plainText)

    expect(hashedText).toBeDefined()
    expect(hashedText).not.toBe(plainText)
    expect(hashedText.length).toBe(88) // SHA-512 base64 produces 88 characters
    expect(hashedText).toMatch(/^[a-z0-9+/]+=*$/i)
  })

  it('should return true for matching text', async () => {
    const hasher = new NodeHasher('sha256')
    const plainText = 'testPassword123'
    const hashedText = await hasher.hash(plainText)

    const isMatch = await hasher.compare(plainText, hashedText)

    expect(isMatch).toBe(true)
  })

  it('should return false for non-matching text', async () => {
    const hasher = new NodeHasher('sha256')
    const plainText = 'testPassword123'
    const wrongText = 'wrongPassword456'
    const hashedText = await hasher.hash(plainText)

    const isMatch = await hasher.compare(wrongText, hashedText)

    expect(isMatch).toBe(false)
  })

  it('should compare correctly with base64 encoding', async () => {
    const hasher = new NodeHasher('sha256', 'base64')
    const plainText = 'testPassword123'
    const hashedText = await hasher.hash(plainText)

    const isMatch = await hasher.compare(plainText, hashedText)

    expect(isMatch).toBe(true)
  })
})
