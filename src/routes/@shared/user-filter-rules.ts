import { z } from 'zod'

import { Role, Status } from '@/types'

export const userFilterRules = {
  search: z.string().trim(),

  statuses: z
    .string()
    .transform(val => val.split(','))
    .pipe(z.array(z.nativeEnum(Status))),

  roles: z
    .string()
    .transform(val => val.split(','))
    .pipe(z.array(z.nativeEnum(Role))),
}
