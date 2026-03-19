import { z } from 'zod'

import type { ValidatedQueryCtx } from '../../@shared'

import { requestValidationRules as rules } from '../../@shared'

export const checkInviteSchema = z.object({
  token: rules.data.securityToken,
})

export type CheckInviteQuery = z.infer<typeof checkInviteSchema>
export type CheckInviteCtx = ValidatedQueryCtx<CheckInviteQuery>
