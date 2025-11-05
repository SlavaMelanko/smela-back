import { describe, expect, it } from 'bun:test'

import { createHasher } from '../factory'

describe('createHasher', () => {
  it('should create a hasher with working hash and compare methods', async () => {
    const hasher = createHasher()

    expect(hasher).toBeDefined()
    expect(typeof hasher.hash).toBe('function')
    expect(typeof hasher.compare).toBe('function')

    const plainText = 'password123'
    const hashedText = await hasher.hash(plainText)
    expect(hashedText).toBeDefined()
    expect(typeof hashedText).toBe('string')

    const isMatch = await hasher.compare(plainText, hashedText)
    expect(isMatch).toBe(true)
  })

  it('should throw error for unknown algorithm', () => {
    expect(() => {
      // @ts-expect-error - testing invalid algorithm
      createHasher('invalid')
    }).toThrow('Unknown algorithm: invalid')
  })
})
