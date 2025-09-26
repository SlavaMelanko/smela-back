import { z } from 'zod'

const rules = {
  emailSenderProfiles: z.string().transform((str) => {
    try {
      const parsed = JSON.parse(str)
      const profileSchema = z.record(z.string(), z.object({
        email: z.string().email(),
        name: z.string(),
      }))

      return profileSchema.parse(parsed)
    } catch {
      throw new Error('Invalid EMAIL_SENDER_PROFILES format. Expected valid JSON with profile objects.')
    }
  }),

  emailResendApiKey: z.string().optional(),

  // Ethereal email configuration (for development)
  emailEtherealHost: z.string().optional(),
  emailEtherealPort: z.coerce.number().optional(),
  emailEtherealUsername: z.string().optional(),
  emailEtherealPassword: z.string().optional(),
}

export default rules
