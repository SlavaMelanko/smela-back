import { envRules } from '../validation'

export const coreEnv = {
  NODE_ENV: envRules.nodeEnv,
  LOG_LEVEL: envRules.logLevel,
}
