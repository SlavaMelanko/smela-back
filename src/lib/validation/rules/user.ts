import { z } from 'zod'

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&])[A-Z\d@$!%*#?&]{8,}$/i

const normalizeEmail = (email: string): string => email.trim().toLowerCase()

/**
 * Wraps a Zod schema with required and optional variants
 * @param schema - The base Zod schema
 * @returns Object with .req (required) and .opt (optional) properties
 */
const withVariants = <T extends z.ZodTypeAny>(schema: T) => ({
  req: schema, // already required by default
  opt: schema.nullable().optional(), // explicitly made optional
})

const rules = {
  email: withVariants(
    z
      .string()
      .transform(normalizeEmail)
      .refine(email => z.string().email().safeParse(email).success, {
        message: 'Invalid email',
      }),
  ),
  password: withVariants(
    z
      .string()
      .min(8)
      .regex(PASSWORD_REGEX, {
        message: 'Minimum eight characters, at least one letter, one number and one special character',
      }),
  ),
  name: withVariants(z.string().min(2).max(50)),
}

export default rules
