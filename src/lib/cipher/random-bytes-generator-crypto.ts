import crypto from 'node:crypto'

import type RandomBytesGenerator from './random-bytes-generator'

class CryptoRandomBytesGenerator implements RandomBytesGenerator {
  generate(numberOfBytes: number): string {
    return crypto.randomBytes(numberOfBytes).toString('hex')
  }
}

export default CryptoRandomBytesGenerator
