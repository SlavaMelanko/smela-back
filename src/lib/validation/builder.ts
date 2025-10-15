import { z } from 'zod'

export const buildSchema = <T extends z.ZodRawShape>(shape: T) => z.object(shape)
