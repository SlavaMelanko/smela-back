import type { RandomBytesGenerator } from '@/crypto'

import { createRandomBytesGenerator } from '@/crypto'

import type { Options } from './options'
import type TokenGenerator from './token-generator'

import { DEFAULT_EXPIRY_HOURS, TOKEN_LENGTH } from './options'

class CryptoTokenGenerator implements TokenGenerator {
  private readonly options: Required<Options>
  private readonly cryptoGenerator: RandomBytesGenerator

  constructor(options?: Options) {
    this.options = {
      expiryHours: options?.expiryHours ?? DEFAULT_EXPIRY_HOURS,
      tokenLength: options?.tokenLength ?? TOKEN_LENGTH,
    }
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
