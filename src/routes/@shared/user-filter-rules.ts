import { z } from 'zod'

import { Role, Status } from '@/types'

export const userFilterRules = {
  search: z.string().trim(),

  statuses: z
    .string()
    .transform(val => val.split(','))
    .pipe(z.array(z.enum(Status))),

  roles: z
    .string()
    .transform(val => val.split(','))
    .pipe(z.array(z.enum(Role))),
}
