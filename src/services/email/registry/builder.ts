import type { EmailRegistry } from './registry'

import { EmailVerificationEmailConfig, PasswordResetEmailConfig, UserInvitationEmailConfig } from '../configs'
import { DefaultEmailRegistry } from './registry-default'

export const buildEmailRegistry = (): EmailRegistry => {
  const registry = new DefaultEmailRegistry()

  registry.add(new EmailVerificationEmailConfig())
  registry.add(new PasswordResetEmailConfig())
  registry.add(new UserInvitationEmailConfig())

  return registry
}
