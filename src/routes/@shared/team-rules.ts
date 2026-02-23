import { z } from 'zod'

export const teamRules = {
  name: z.string().trim().min(1).max(255),
  website: z.url().max(255),
  description: z.string().trim().max(2000),
  position: z.string().trim().max(100),
  search: z.string().trim().max(100),
}
