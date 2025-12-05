import { z } from 'zod'

import { captchaRules } from './captcha-rules'
import { dataRules } from './data-rules'
import { preferencesRules } from './preferences-rules'

export type { AppCtx, ValidatedCtx } from './handler'

export const requestValidationRules = {
  data: dataRules,
  captcha: captchaRules,
  preferences: preferencesRules,
}

export const nestedSchemas = {
  captcha: z.object({
    token: captchaRules.token,
  }),
  preferences: z.object({
    locale: preferencesRules.locale,
    theme: preferencesRules.theme,
  }),
}
