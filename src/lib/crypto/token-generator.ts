interface TokenGenerator {
  generate: () => string
  generateWithExpiry: () => { token: string, expiresAt: Date }
}

export default TokenGenerator
