import { z } from 'zod'

import { captchaRules } from './captcha-rules'
import { dataRules } from './data-rules'
import { paginationRules } from './pagination-rules'
import { preferencesRules } from './preferences-rules'
import { userFilterRules } from './user-filter-rules'

export type { AppCtx, ValidatedJsonCtx, ValidatedParamCtx, ValidatedQueryCtx } from './handler'

export const requestValidationRules = {
  data: dataRules,
  captcha: captchaRules,
  pagination: paginationRules,
  preferences: preferencesRules,
  userFilter: userFilterRules,
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
