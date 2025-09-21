import { envRules } from '../validation'

export const emailEnv = {
  EMAIL_SENDER_PROFILES: envRules.emailSenderProfiles,

  // 'ethereal' for development to avoid bloating inbox, otherwise - 'resend'.
  EMAIL_PROVIDER: envRules.emailProvider,

  EMAIL_RESEND_API_KEY: envRules.emailResendApiKey,

  EMAIL_ETHEREAL_HOST: envRules.emailEtherealHost,
  EMAIL_ETHEREAL_PORT: envRules.emailEtherealPort,
  EMAIL_ETHEREAL_USERNAME: envRules.emailEtherealUsername,
  EMAIL_ETHEREAL_PASSWORD: envRules.emailEtherealPassword,
}
