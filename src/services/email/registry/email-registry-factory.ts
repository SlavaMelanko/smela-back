import type { EmailRegistry } from './email-registry'

import { PasswordResetEmailConfig, WelcomeEmailConfig } from './email-config'
import { DefaultEmailRegistry } from './email-registry-default'

export const createEmailRegistry = (): EmailRegistry => {
  const registry = new DefaultEmailRegistry()

  registry.register(new WelcomeEmailConfig())
  registry.register(new PasswordResetEmailConfig())

  return registry
}
