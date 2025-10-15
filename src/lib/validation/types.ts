import type { z } from 'zod'

/**
 * Infers TypeScript type from a Zod schema
 *
 * @template T - Zod schema type
 *
 * @example
 * const userSchema = buildSchema({ name: z.string(), age: z.number() })
 * type User = InferType<typeof userSchema> // { name: string; age: number }
 */
export type InferType<T extends z.ZodTypeAny> = z.infer<T>
