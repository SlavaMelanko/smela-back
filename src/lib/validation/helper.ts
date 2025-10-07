import type { z } from 'zod'

/**
 * Infers TypeScript type from a Zod schema
 *
 * @template T - Zod schema type
 *
 * @example
 * const userSchema = buildStrictSchema({ name: z.string(), age: z.number() })
 * type User = InferType<typeof userSchema> // { name: string; age: number }
 */
export type InferType<T extends z.ZodTypeAny> = z.infer<T>

/**
 * Extends a Zod schema with an optional variant
 * The schema itself remains required by default
 * Access the optional variant with .opt
 *
 * @param schema - The base Zod schema
 *
 * @returns The schema extended with .opt property
 */
export const withVariants = <T extends z.ZodTypeAny>(schema: T): T & { opt: z.ZodOptional<z.ZodNullable<T>> } => {
  return Object.assign(schema, {
    opt: schema.nullable().optional(),
  })
}
