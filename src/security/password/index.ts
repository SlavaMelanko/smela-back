import { createHasher, createRandomBytesGenerator } from '@/crypto'

export const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&])[A-Z\d@$!%*#?&]{8,}$/i

export const hashPassword = async (password: string): Promise<string> => {
  const hasher = createHasher()

  return hasher.hash(password)
}

export const generatePasswordHash = async (length = 32): Promise<string> => {
  const generator = createRandomBytesGenerator()
  const password = generator.generate(length)

  return hashPassword(password)
}

export const comparePasswordHashes = async (password: string, hash: string): Promise<boolean> => {
  if (!password || !hash) {
    return false
  }

  const hasher = createHasher()

  return hasher.compare(password, hash)
}
