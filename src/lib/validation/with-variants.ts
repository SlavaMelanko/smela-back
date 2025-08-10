import type { z } from 'zod'

/**
 * Extends a Zod schema with an optional variant
 * The schema itself remains required by default
 * Access the optional variant with .opt
 * @param schema - The base Zod schema
 * @returns The schema extended with .opt property
 */
export const withVariants = <T extends z.ZodTypeAny>(schema: T): T & { opt: z.ZodOptional<z.ZodNullable<T>> } => {
  return Object.assign(schema, {
    opt: schema.nullable().optional(),
  })
}
