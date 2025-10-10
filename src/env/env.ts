import type { ZodError } from 'zod'

import { z } from 'zod'

import { companyEnvVars } from './company'
import { coreEnvVars } from './core'
import { dbEnvVars } from './db'
import { emailEnvVars } from './email'
import { networkEnvVars } from './network'
import { captchaEnvVars } from './services'

const validate = () => {
  try {
    const envSchema = z.object({
      ...coreEnvVars,
      ...dbEnvVars,
      ...networkEnvVars,
      ...emailEnvVars,
      ...companyEnvVars,
      ...captchaEnvVars,
    })

    // eslint-disable-next-line node/no-process-env
    return envSchema.parse(process.env)
  } catch (e) {
    const error = e as ZodError
    console.error('❌ Invalid env:', error.flatten().fieldErrors)
    process.exit(1)
  }
}

const env = validate()

export default env
