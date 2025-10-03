import { pgEnum } from 'drizzle-orm/pg-core'

export const createPgEnum = <T extends Record<string, string>>(name: string, enumObj: T) => {
  const values = Object.values(enumObj)

  return pgEnum(name, values as [string, ...string[]])
}
