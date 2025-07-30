import type { RandomBytesGenerator } from '../crypto'
import type { Options } from './options'
import type TokenGenerator from './token-generator'

import { createRandomBytesGenerator } from '../crypto'
import { DEFAULT_OPTIONS } from './options'

class CryptoTokenGenerator implements TokenGenerator {
  private readonly options: Required<Options>
  private readonly cryptoGenerator: RandomBytesGenerator

  constructor(options?: Options) {
    this.options = { ...DEFAULT_OPTIONS, ...options }
    this.cryptoGenerator = createRandomBytesGenerator()
  }

  generate(): string {
    const numberOfBytes = this.options.tokenLength / 2

    return this.cryptoGenerator.generate(numberOfBytes)
  }

  generateWithExpiry(): { token: string, expiresAt: Date } {
    const token = this.generate()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + this.options.expiryHours)

    return { token, expiresAt }
  }
}

export default CryptoTokenGenerator
