import { z } from 'zod'

import type { ValidatedJsonCtx } from '../../@shared'

import { requestValidationRules as rules } from '../../@shared'

const checkInviteSchema = z.object({
  data: z.object({
    token: rules.data.securityToken,
  }).strict(),
}).strict()

export type CheckInviteBody = z.infer<typeof checkInviteSchema>
export type CheckInviteCtx = ValidatedJsonCtx<CheckInviteBody>

export default checkInviteSchema
