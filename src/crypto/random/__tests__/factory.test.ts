import { describe, expect, it } from 'bun:test'

import { createRandomBytesGenerator } from '../factory'

describe('createRandomBytesGenerator', () => {
  it('should create a generator with working generate method', () => {
    const generator = createRandomBytesGenerator()

    expect(generator).toBeDefined()
    expect(typeof generator.generate).toBe('function')

    const result = generator.generate(16)
    expect(result).toBeDefined()
    expect(typeof result).toBe('string')
  })

  it('should throw error for unknown implementation', () => {
    expect(() => {
      // @ts-expect-error - testing invalid implementation
      createRandomBytesGenerator('invalid')
    }).toThrow('Unknown random bytes generator: invalid')
  })
})
