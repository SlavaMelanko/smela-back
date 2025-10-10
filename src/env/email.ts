import { z } from 'zod'

export const emailEnvVars = {
  EMAIL_SENDER_PROFILES: z.string().transform((str) => {
    const parsed = JSON.parse(str) as unknown
    const profileSchema = z.record(z.string(), z.object({
      email: z.string().email(),
      name: z.string(),
    }))

    return profileSchema.parse(parsed)
  }),

  EMAIL_RESEND_API_KEY: z.string().optional(),

  // Ethereal email configuration (for development)
  EMAIL_ETHEREAL_HOST: z.string().optional(),
  EMAIL_ETHEREAL_PORT: z.coerce.number().optional(),
  EMAIL_ETHEREAL_USERNAME: z.string().optional(),
  EMAIL_ETHEREAL_PASSWORD: z.string().optional(),
}
