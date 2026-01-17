import { z } from 'zod'

import type { ValidatedJsonCtx } from '../../@shared'

import { requestValidationRules as rules } from '../../@shared'

const acceptInviteSchema = z.object({
  data: z.object({
    token: rules.data.securityToken,
    password: rules.data.password,
  }).strict(),
}).strict()

export type AcceptInviteBody = z.infer<typeof acceptInviteSchema>
export type AcceptInviteCtx = ValidatedJsonCtx<AcceptInviteBody>

export default acceptInviteSchema
