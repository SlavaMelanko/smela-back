import { captchaRules } from './captcha-rules'
import { dataRules } from './data-rules'
import { preferencesRules } from './preferences-rules'

export const requestValidationRules = {
  data: dataRules,
  captcha: captchaRules,
  preferences: preferencesRules,
}
