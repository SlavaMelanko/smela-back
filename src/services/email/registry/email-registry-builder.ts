import type { EmailRegistry } from './email-registry'

import { PasswordResetEmailConfig, WelcomeEmailConfig } from '../configs'
import { DefaultEmailRegistry } from './email-registry-default'

export const buildEmailRegistry = (): EmailRegistry => {
  const registry = new DefaultEmailRegistry()

  registry.add(new WelcomeEmailConfig())
  registry.add(new PasswordResetEmailConfig())

  return registry
}
