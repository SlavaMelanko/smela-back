import { z } from 'zod'

export const preferencesRules = {
  locale: z.enum(['en', 'uk']).default('en'),
  theme: z.enum(['light', 'dark']).default('light'),
}
