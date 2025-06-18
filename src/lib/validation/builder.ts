import { z } from 'zod'

const buildSchema = <T extends z.ZodRawShape>(shape: T) => {
  return z.object(shape)
}

export default { buildSchema }
