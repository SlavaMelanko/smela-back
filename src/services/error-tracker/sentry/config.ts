import env from '@/env'

import type { Config } from '../config'

import packageJson from '../../../../package.json'

export const sentryConfig: Config = {
  dsn: env.SENTRY_DSN,
  environment: env.NODE_ENV,
  release: `${packageJson.name}@${packageJson.version}`,
}
