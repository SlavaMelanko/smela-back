import { z } from 'zod'

import type { ValidatedQueryCtx } from '@/routes/validated-ctx'

import { rules } from '@/routes/rules'

export const checkInviteQuerySchema = z.object({
  token: rules.token.oneTime,
})

export type CheckInviteQuery = z.infer<typeof checkInviteQuerySchema>
export type CheckInviteCtx = ValidatedQueryCtx<CheckInviteQuery>
