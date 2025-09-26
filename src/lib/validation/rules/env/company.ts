import { z } from 'zod'

const rules = {
  companyName: z.string().default('SMELA'),
  companySocialLinks: z.string().optional().transform((str) => {
    if (!str) {
      return {}
    }

    try {
      const parsed = JSON.parse(str)

      return z.record(z.string(), z.string().url()).parse(parsed)
    } catch {
      return {}
    }
  }),
}

export default rules
