import { TOKEN_EXPIRY_HOURS, TOKEN_LENGTH } from './constants'

export interface Options {
  expiryHours?: number
  tokenLength?: number
}

const DEFAULT_OPTIONS: Required<Options> = {
  expiryHours: TOKEN_EXPIRY_HOURS,
  tokenLength: TOKEN_LENGTH,
}

export { DEFAULT_OPTIONS }
