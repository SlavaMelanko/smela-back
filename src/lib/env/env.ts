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
      ...captchaEnv,
      ...companyEnv,
      ...coreEnv,
      ...dbEnv,
      ...emailEnv,
      ...networkEnv,
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
