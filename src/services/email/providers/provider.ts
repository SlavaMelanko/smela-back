import type { EmailPayload } from './payload'

export interface EmailProvider {
  send: (payload: EmailPayload) => Promise<void>
}
