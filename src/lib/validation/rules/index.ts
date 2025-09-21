import { captchaRules, companyRules, coreRules, dbRules, emailRules, networkRules } from './env/index'
import jwtRules from './jwt'
import tokenRules from './token'
import userRules from './user'

// Combine all env rules for backward compatibility
const envRules = {
  ...coreRules,
  ...dbRules,
  ...networkRules,
  ...emailRules,
  ...companyRules,
  ...captchaRules,
}

export { envRules, jwtRules, tokenRules, userRules }
export { captchaRules, companyRules, coreRules, dbRules, emailRules, networkRules }
