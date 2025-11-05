import crypto from 'node:crypto'

import type RandomBytesGenerator from './random-bytes-generator'

class NodeRandomBytesGenerator implements RandomBytesGenerator {
  generate(numberOfBytes: number, encoding: BufferEncoding = 'hex'): string {
    return crypto.randomBytes(numberOfBytes).toString(encoding)
  }
}

export default NodeRandomBytesGenerator
