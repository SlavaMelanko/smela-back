/**
 * Generates cryptographically secure random bytes as encoded strings
 */
export default interface RandomBytesGenerator {
  /**
   * Generates random bytes and returns them in the specified encoding
   * @param numberOfBytes - Number of random bytes to generate
   * @param encoding - Output encoding format (default: 'hex')
   * @returns Encoded string representation of random bytes
   */
  generate: (numberOfBytes: number, encoding?: BufferEncoding) => string
}
