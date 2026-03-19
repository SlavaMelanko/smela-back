import { z } from 'zod'

import type { ValidatedQueryCtx } from '@/routes/validated-ctx'

import { rules } from '@/routes/rules'

export const checkInviteSchema = z.object({
  token: rules.token.oneTime,
})

export type CheckInviteQuery = z.infer<typeof checkInviteSchema>
export type CheckInviteCtx = ValidatedQueryCtx<CheckInviteQuery>
