import 'dotenv/config'

interface CompanyEnv {
  companyName: string
  companySocialLinks: Record<string, string>
}

const DEFAULT_SOCIAL_LINKS = {} as const

const parseSocialLinks = (jsonString?: string) => {
  if (!jsonString) {
    return DEFAULT_SOCIAL_LINKS
  }

  try {
    const parsed = JSON.parse(jsonString) as unknown

    return (parsed && typeof parsed === 'object' && !Array.isArray(parsed))
      ? parsed as CompanyEnv['companySocialLinks']
      : DEFAULT_SOCIAL_LINKS
  } catch {
    return DEFAULT_SOCIAL_LINKS
  }
}

const createCompanyEnv = (): CompanyEnv => {
  // eslint-disable-next-line node/no-process-env
  const { COMPANY_NAME, COMPANY_SOCIAL_LINKS } = process.env

  return {
    companyName: COMPANY_NAME || 'SMELA',
    companySocialLinks: parseSocialLinks(COMPANY_SOCIAL_LINKS),
  }
}

export const env = createCompanyEnv()
