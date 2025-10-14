import crypto from 'node:crypto'

import type RandomBytesGenerator from './random-bytes-generator'

class CryptoRandomBytesGenerator implements RandomBytesGenerator {
  generate(numberOfBytes: number, encoding: BufferEncoding = 'hex'): string {
    return crypto.randomBytes(numberOfBytes).toString(encoding)
  }
}

export default CryptoRandomBytesGenerator
