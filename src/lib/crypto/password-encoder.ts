interface PasswordEncoder {
  hash: (plain: string) => Promise<string>
  compare: (plain: string, hashed: string) => Promise<boolean>
}

export default PasswordEncoder
