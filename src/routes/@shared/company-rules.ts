import { z } from 'zod'

export const companyRules = {
  name: z.string().trim().min(1).max(255),
  website: z.string().trim().url().max(255),
  description: z.string().trim().max(2000),
  search: z.string().trim().max(100),
}
