import { z } from 'zod'

const rules = {
  url: z.string().url(),
  maxConnections: z.coerce.number().int().min(1).max(10).default(2),
}

export default rules
