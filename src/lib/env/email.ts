import { emailRules } from '../validation'

export const emailEnv = {
  EMAIL_SENDER_PROFILES: emailRules.emailSenderProfiles,

  EMAIL_RESEND_API_KEY: emailRules.emailResendApiKey,

  EMAIL_ETHEREAL_HOST: emailRules.emailEtherealHost,
  EMAIL_ETHEREAL_PORT: emailRules.emailEtherealPort,
  EMAIL_ETHEREAL_USERNAME: emailRules.emailEtherealUsername,
  EMAIL_ETHEREAL_PASSWORD: emailRules.emailEtherealPassword,
}
