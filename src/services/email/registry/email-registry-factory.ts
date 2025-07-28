import type { EmailRegistry } from './email-registry'

import { emailConfig } from './email-config'
import { DefaultEmailRegistry } from './email-registry-default'

export const createEmailRegistry = (): EmailRegistry => {
  const registry = new DefaultEmailRegistry()

  // Register all email configurations
  registry.register(emailConfig.welcome)
  registry.register(emailConfig.passwordReset)

  return registry
}
