import { createPasswordEncoder } from './factory'

export const hashPassword = async (password: string): Promise<string> => {
  const encoder = createPasswordEncoder()

  return encoder.hash(password)
}

export const comparePasswords = async (password: string, hash: string): Promise<boolean> => {
  if (!password || !hash) {
    return false
  }

  const encoder = createPasswordEncoder()

  return await encoder.compare(password, hash)
}
