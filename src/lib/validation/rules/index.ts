import { captchaRules, companyRules, coreRules, dbRules, emailRules, networkRules } from './env/index'

export { default as jwtRules } from './jwt'
export { default as tokenRules } from './token'
export { default as userRules } from './user'

// Combine all env rules for backward compatibility
export const envRules = {
  ...coreRules,
  ...dbRules,
  ...networkRules,
  ...emailRules,
  ...companyRules,
  ...captchaRules,
}

export { captchaRules, companyRules, coreRules, dbRules, emailRules, networkRules }
