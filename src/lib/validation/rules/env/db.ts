import { z } from 'zod'

const rules = {
  dbUrl: z.string().url(),
}

export default rules
