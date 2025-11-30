import { z } from 'zod'

export const emailEnvVars = (nodeEnv?: string) => ({
  EMAIL_RESEND_API_KEY: nodeEnv === 'production' || nodeEnv === 'staging'
    ? z.string().min(1, 'EMAIL_RESEND_API_KEY is required in production/staging environments')
    : z.string().optional(),

  // Ethereal email configuration (for development)
  EMAIL_ETHEREAL_HOST: z.string().optional(),
  EMAIL_ETHEREAL_PORT: z.coerce.number().optional(),
  EMAIL_ETHEREAL_USERNAME: z.string().optional(),
  EMAIL_ETHEREAL_PASSWORD: z.string().optional(),

  EMAIL_SENDER_PROFILES: z.string().transform((str) => {
    const parsed = JSON.parse(str) as unknown
    const profileSchema = z.record(z.string(), z.object({
      email: z.string().email(),
      name: z.string(),
    }))

    return profileSchema.parse(parsed)
  }),
})
