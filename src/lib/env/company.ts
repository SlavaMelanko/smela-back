import { companyRules } from '../validation'

export const companyEnv = {
  COMPANY_NAME: companyRules.companyName,
  COMPANY_SOCIAL_LINKS: companyRules.companySocialLinks,
}
