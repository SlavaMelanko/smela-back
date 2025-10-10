import { z } from 'zod'

export const companyEnvVars = {
  COMPANY_NAME: z.string().default('SMELA'),
  COMPANY_SOCIAL_LINKS: z.string().optional().transform((str) => {
    if (!str) {
      return {}
    }

    try {
      const parsed = JSON.parse(str) as unknown

      return z.record(z.string(), z.string().url()).parse(parsed)
    } catch {
      return {}
    }
  }),
}
