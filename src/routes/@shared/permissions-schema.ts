import { z } from 'zod'

import Resource from '@/types/resource'

const resourcePermissions = z.object({ view: z.boolean(), manage: z.boolean() }).optional()

export const permissionsSchema = z.object(
  Object.fromEntries(
    Object.values(Resource).map(r => [r, resourcePermissions]),
  ) as Record<Resource, typeof resourcePermissions>,
)

export type Permissions = z.infer<typeof permissionsSchema>
