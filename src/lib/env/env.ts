import type { ZodError } from 'zod'

import { buildSchema } from '../validation'
import { companyEnv } from './company'
import { coreEnv } from './core'
import { dbEnv } from './db'
import { emailEnv } from './email'
import { networkEnv } from './network'
import { captchaEnv } from './services'

const validate = () => {
  try {
    const envSchema = buildSchema({
      ...coreEnv,
      ...dbEnv,
      ...networkEnv,
      ...emailEnv,
      ...companyEnv,
      ...captchaEnv,
    })

    // eslint-disable-next-line node/no-process-env
    return envSchema.parse(process.env)
  } catch (e) {
    if (e && typeof e === 'object' && 'flatten' in e && typeof e.flatten === 'function') {
      // This is a ZodError
      const error = e as ZodError
      console.error('❌ Invalid env:', error.flatten().fieldErrors)
    } else {
      // This is some other error (e.g., missing files, syntax errors)
      console.error('❌ Environment validation failed:', e)
    }

    process.exit(1)
  }
}

const env = validate()

export default env
