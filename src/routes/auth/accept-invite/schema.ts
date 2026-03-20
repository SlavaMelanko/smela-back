import { z } from 'zod'

import type { ValidatedJsonCtx } from '@/routes/validated-ctx'

import { rules } from '@/routes/rules'

export const acceptInviteBodySchema = z.object({
  token: rules.token.oneTime,
  password: rules.user.password,
}).strict()

export type AcceptInviteBody = z.infer<typeof acceptInviteBodySchema>
export type AcceptInviteCtx = ValidatedJsonCtx<AcceptInviteBody>
