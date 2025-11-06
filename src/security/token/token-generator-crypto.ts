import type { RandomBytesGenerator } from '@/crypto'

import { createRandomBytesGenerator } from '@/crypto'
import { nowPlus, seconds } from '@/utils/chrono'

import type { Options } from './options'
import type TokenGenerator from './token-generator'

import { DEFAULT_EXPIRY_SECONDS, TOKEN_LENGTH } from './options'

class CryptoTokenGenerator implements TokenGenerator {
  private readonly options: Required<Options>
  private readonly generator: RandomBytesGenerator

  constructor(options?: Options) {
    this.options = {
      expirySeconds: options?.expirySeconds ?? DEFAULT_EXPIRY_SECONDS,
      tokenLength: options?.tokenLength ?? TOKEN_LENGTH,
    }
    this.generator = createRandomBytesGenerator()
  }

  generate(): string {
    const numberOfBytes = this.options.tokenLength / 2 // hex encoding: 1 byte = 2 chars

    return this.generator.generate(numberOfBytes)
  }

  generateWithExpiry(): { token: string, expiresAt: Date } {
    const token = this.generate()
    const expiresAt = nowPlus(seconds(this.options.expirySeconds))

    return { token, expiresAt }
  }
}

export default CryptoTokenGenerator
