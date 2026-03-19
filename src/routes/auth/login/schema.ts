import { z } from 'zod'

import type { ValidatedJsonCtx } from '@/routes/validated-ctx'

import { rules } from '@/routes/rules'

export const loginSchema = z.object({
  email: rules.user.email,
  password: rules.user.password,
  captcha: z.object({
    token: rules.captcha.token,
  }).strict(),
}).strict()

export type LoginBody = z.infer<typeof loginSchema>
export type LoginCtx = ValidatedJsonCtx<LoginBody>
