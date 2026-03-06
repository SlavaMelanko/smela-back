import { z } from 'zod'

import Resource from '@/types/resource'

const resourcePermissions = z
  .object({
    view: z.boolean().nullish().transform(v => v ?? false),
    manage: z.boolean().nullish().transform(v => v ?? false),
  })
  .optional()

export const permissionsSchema = z
  .object(
    Object.fromEntries(
      Object.values(Resource).map(r => [r, resourcePermissions]),
    ) as Record<Resource, typeof resourcePermissions>,
  )
  .refine(
    data => Object.values(data).some(v => v !== undefined),
    { message: 'At least one resource must be specified' },
  )

export type Permissions = z.infer<typeof permissionsSchema>
