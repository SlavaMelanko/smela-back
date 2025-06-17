import { z } from 'zod'

export function buildSchema<T extends z.ZodRawShape>(shape: T) {
  return z.object(shape)
}
