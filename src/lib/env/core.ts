import { coreRules } from '../validation'

export const coreEnv = {
  NODE_ENV: coreRules.nodeEnv,
  LOG_LEVEL: coreRules.logLevel,
}
