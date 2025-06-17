export abstract class PasswordEncoder {
  abstract hash(plain: string): Promise<string>
  abstract compare(plain: string, hashed: string): Promise<boolean>
}
