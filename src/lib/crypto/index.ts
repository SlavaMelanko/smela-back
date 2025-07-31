import type PasswordEncoder from './password-encoder'
import type RandomBytesGenerator from './random-bytes-generator'

import { createPasswordEncoder, createRandomBytesGenerator } from './factory'

export type { PasswordEncoder, RandomBytesGenerator }

export { createPasswordEncoder, createRandomBytesGenerator }
