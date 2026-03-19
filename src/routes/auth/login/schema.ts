import { z } from 'zod'

import type { ValidatedJsonCtx } from '@/routes/validated-ctx'

import { rules } from '@/routes/rules'

export const loginBodySchema = z.object({
  email: rules.user.email,
  password: rules.user.password,
  captcha: z.object({
    token: rules.captcha.token,
  }).strict(),
}).strict()

export type LoginBody = z.infer<typeof loginBodySchema>
export type LoginCtx = ValidatedJsonCtx<LoginBody>
