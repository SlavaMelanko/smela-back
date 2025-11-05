import type RandomBytesGenerator from './random-bytes-generator'

import NodeRandomBytesGenerator from './random-bytes-generator-node'

export const createRandomBytesGenerator = (impl: 'node' = 'node'): RandomBytesGenerator => {
  switch (impl) {
    case 'node':
      return new NodeRandomBytesGenerator()
    default:
      throw new Error(`Unknown random bytes generator: ${impl as string}`)
  }
}
