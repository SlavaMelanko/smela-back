import { z } from 'zod'

export const buildSchema = <T extends z.ZodRawShape>(shape: T) => z.object(shape)

export const buildStrictSchema = <T extends z.ZodRawShape>(shape: T) => buildSchema(shape).strict()
